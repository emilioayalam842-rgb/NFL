"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paymentClaimSchema } from "@/lib/validation";
import { verifyPaymentClaim } from "@/lib/banxico/verify-claim";

export async function startSubscription(planSlug: string) {
  const session = await auth();
  if (!session?.user) redirect(`/ingresar?callbackUrl=/planes`);

  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (user?.selfExcludedUntil && user.selfExcludedUntil > new Date()) {
    redirect("/cuenta?excluido=1");
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) redirect("/planes");

  let subscription = await prisma.subscription.findFirst({
    where: { userId: session!.user.id, planId: plan!.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: { userId: session!.user.id, planId: plan!.id, status: "PENDING" },
    });
  }

  redirect(`/suscripcion/${subscription.id}`);
}

export async function submitPaymentClaim(subscriptionId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/ingresar");

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!subscription || subscription.userId !== session!.user.id) {
    throw new Error("Suscripción no encontrada.");
  }

  const parsed = paymentClaimSchema.safeParse({
    subscriptionId,
    amountMXN: subscription.plan.priceMXN,
    claveRastreo: formData.get("claveRastreo"),
    fechaOperacion: formData.get("fechaOperacion"),
    bancoEmisor: formData.get("bancoEmisor"),
    cuentaOrdenante: formData.get("cuentaOrdenante"),
  });

  if (!parsed.success) {
    throw new Error("Revisa los datos del formulario: " + parsed.error.issues[0]?.message);
  }

  const claim = await prisma.paymentClaim.create({
    data: {
      userId: session!.user.id,
      subscriptionId,
      amountMXN: parsed.data.amountMXN,
      claveRastreo: parsed.data.claveRastreo,
      fechaOperacion: new Date(parsed.data.fechaOperacion),
      bancoEmisor: parsed.data.bancoEmisor,
      cuentaOrdenante: parsed.data.cuentaOrdenante,
    },
  });

  await verifyPaymentClaim(claim.id);

  revalidatePath(`/suscripcion/${subscriptionId}`);
}

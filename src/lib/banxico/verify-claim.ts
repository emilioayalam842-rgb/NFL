import { prisma } from "@/lib/prisma";
import { lookupCep } from "./cep";
import type { VerificationMethod } from "@prisma/client";

const PAYOUT_CLABE = process.env.PAYOUT_CLABE ?? "";
const RECEPTOR_BANK_CODE = "646"; // STP by default — cambia si tu cuenta es de otro banco

async function activateSubscription(claimId: string, method: VerificationMethod) {
  const claim = await prisma.paymentClaim.findUniqueOrThrow({
    where: { id: claimId },
    include: { subscription: { include: { plan: true } } },
  });

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const endDate = new Date(now.getTime() + claim.subscription.plan.intervalDays * 24 * 60 * 60 * 1000);

    await tx.subscription.update({
      where: { id: claim.subscriptionId },
      data: { status: "ACTIVE", startDate: now, endDate },
    });

    return tx.paymentClaim.update({
      where: { id: claimId },
      data: { status: "VERIFIED", verificationMethod: method, verifiedAt: now },
    });
  });
}

/**
 * Runs the Banxico CEP bot against a pending PaymentClaim and updates it
 * (and the linked Subscription, if verified) accordingly. Anything short of
 * a confident match is routed to MANUAL_REVIEW instead of being rejected
 * outright — a scraper failure is not proof the user didn't pay.
 */
export async function verifyPaymentClaim(claimId: string) {
  const claim = await prisma.paymentClaim.findUnique({ where: { id: claimId } });
  if (!claim) throw new Error("Reporte de pago no encontrado");
  if (claim.status !== "PENDING" && claim.status !== "MANUAL_REVIEW") return claim;

  const result = await lookupCep({
    fecha: claim.fechaOperacion,
    claveRastreo: claim.claveRastreo,
    emisor: claim.bancoEmisor,
    receptor: RECEPTOR_BANK_CODE,
    cuentaOrdenante: claim.cuentaOrdenante,
    cuentaBeneficiaria: PAYOUT_CLABE,
    monto: claim.amountMXN / 100,
  });

  if (result.status === "MATCH") {
    return activateSubscription(claimId, "AUTO_BANXICO");
  }

  // NOT_FOUND, AMOUNT_MISMATCH, or UNAVAILABLE all fall through to a human.
  return prisma.paymentClaim.update({
    where: { id: claimId },
    data: {
      status: "MANUAL_REVIEW",
      banxicoResponse: JSON.stringify({
        status: result.status,
        reason: "reason" in result ? result.reason : undefined,
      }),
    },
  });
}

/** Admin override: approve or reject a claim by hand, bypassing the bot. */
export async function resolveClaimManually(claimId: string, approve: boolean, note?: string) {
  if (approve) {
    return activateSubscription(claimId, "MANUAL_ADMIN");
  }
  return prisma.paymentClaim.update({
    where: { id: claimId },
    data: { status: "REJECTED", verificationMethod: "MANUAL_ADMIN", adminNote: note },
  });
}

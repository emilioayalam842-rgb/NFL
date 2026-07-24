import { startSubscription } from "../actions";

export default async function NuevaSuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  await startSubscription(plan ?? "mensual");
  return null;
}

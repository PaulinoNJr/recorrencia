import { EditSubscription } from "@/components/account";
import { normalizeLegacyFrequency } from "@/lib/legacy-frequency";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ciclo?: string }>;
}) {
  const { id } = await params;
  const { ciclo } = await searchParams;
  return <EditSubscription id={id} cycleFrequency={normalizeLegacyFrequency(ciclo)} />;
}

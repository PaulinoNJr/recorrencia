import { notFound } from "next/navigation";
import { PurchaseCheckout } from "@/components/purchase-checkout";
export default async function Page({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!["dados", "entrega", "pagamento", "sucesso"].includes(step)) notFound();
  return <PurchaseCheckout step={step} />;
}

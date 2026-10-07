import { SubscriptionDetail } from "@/components/account";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SubscriptionDetail id={id} />;
}

import { EditSubscription } from "@/components/account";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditSubscription id={id} />;
}

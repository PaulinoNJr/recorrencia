import { Identification } from "@/components/customer-identification";
import { accountReturnPath } from "@/lib/account-navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <Identification next={accountReturnPath(next)} />;
}

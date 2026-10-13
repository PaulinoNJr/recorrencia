import { Identification } from "@/components/customer-identification";
import { accountReturnPath } from "@/lib/account-navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <Identification next={accountReturnPath((await searchParams).next)} title="Cadastrar-se" />;
}

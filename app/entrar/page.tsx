import { Login } from "@/components/login";
import { accountReturnPath } from "@/lib/account-navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <Login next={accountReturnPath((await searchParams).next)} />;
}

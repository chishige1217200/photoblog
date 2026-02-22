import { getUserSession } from "@/lib/sessionManager";
import ChakuraDemo from "@/components/test/ChakuraDemo";

export default async function Home() {
  const session = await getUserSession();

  return <>{session !== null ? <ChakuraDemo /> : <></>}</>;
}

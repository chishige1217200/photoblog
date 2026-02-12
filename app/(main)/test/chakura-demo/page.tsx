import { auth } from "@/auth";
import ChakuraDemo from "@/components/test/ChakuraDemo";

export default async function Home() {
  const session = await auth();

  return <>{session !== null ? <ChakuraDemo /> : <></>}</>;
}

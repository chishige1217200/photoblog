import { getUserSession } from "@/lib/sessionManager";
import PreviewPhoto from "@/components/test/PreviewPhoto";

export default async function Home() {
  const session = await getUserSession();

  return <>{session !== null ? <PreviewPhoto /> : <></>}</>;
}

import { auth } from "@/auth";
import PreviewPhoto from "@/components/test/PreviewPhoto";

export default async function Home() {
  const session = await auth();

  return <>{session !== null ? <PreviewPhoto /> : <></>}</>;
}

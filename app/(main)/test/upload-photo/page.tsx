import { getUserSession } from "@/lib/sessionManager";
import UploadPhoto from "@/components/test/UploadPhoto";

export default async function Home() {
  const session = await getUserSession();

  return <>{session !== null ? <UploadPhoto /> : <></>}</>;
}

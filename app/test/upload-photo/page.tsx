import { auth } from "@/auth";
import UploadPhoto from "@/components/test/UploadPhoto";

export default async function Home() {
  const session = await auth();

  return <>{session !== null ? <UploadPhoto /> : <></>}</>;
}

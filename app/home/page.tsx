import { auth, signOut } from "@/auth";
import PhotoView from "@/components/photoView";

export default async function Home() {
  const session = await auth();

  return (
    <>
      {session !== null ? (
        <>
          <h1>{session.user?.name}がログインしたよ</h1>
          <h2>メールアドレスは{session.user?.email}</h2>
          <h3>IDは{session.user?.id}</h3>
          <img src={session.user?.image as string} alt="user image" />
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button type="submit">Signout</button>
          </form>
          <PhotoView />
        </>
      ) : (
        <></>
      )}
    </>
  );
}

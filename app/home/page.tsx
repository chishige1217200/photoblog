import { auth, signOut } from "@/auth";

export default async function Home() {
  let session = null;

  console.log(session);

  session = await auth();

  console.log(session);

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
        </>
      ) : (
        <></>
      )}
    </>
  );
}

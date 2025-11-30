import { signIn, auth } from "@/auth";

export default async function Home() {
  let session = null;

  console.log(session);

  session = await auth();

  console.log(session);

  return (
    <>
      {session !== null ? (
        <></>
      ) : (
        <>
          <h1>ログインしてね</h1>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button type="submit">Signin with Google</button>
          </form>
        </>
      )}
    </>
  );
}

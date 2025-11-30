import { signIn, auth } from "@/auth";

export default async function Home() {
  const session = await auth();

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

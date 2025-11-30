import { auth, signOut } from "@/auth";
import PhotoView from "@/components/photoView";

export default async function Home() {
  const session = await auth();

  return (
    <>
      {session !== null ? (
        <div className="flex flex-col items-center">
          <div className="flex gap-2 items-center p-4">
            <h2>ユーザID: {session.user?.email}</h2>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button className="gsi-material-button">
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <span className="gsi-material-button-contents">
                    ログアウト
                  </span>
                  <span style={{ display: "none" }}>ログアウト</span>
                </div>
              </button>
            </form>
          </div>
          <PhotoView />
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

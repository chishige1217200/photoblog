import { signOut } from "@/auth";
import { getUserSession } from "@/lib/sessionManager";
import PhotoView from "@/components/photoView";

export default async function Home() {
  const offlineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";
  const session = await getUserSession();

  return (
    <>
      {session !== null ? (
        <div className="flex flex-col items-center">
          <div className="flex gap-2 items-center p-4">
            <h2>ユーザID: {session.user?.email}</h2>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="gsi-material-button" disabled={offlineMode}>
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

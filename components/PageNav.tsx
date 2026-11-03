import { getUserSession } from "@/lib/sessionManager";
import { signOutAction } from "@/lib/actions/auth";
import PageNavLinks from "@/components/PageNavLinks";

export default async function PageNav() {
  const offlineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";
  const session = await getUserSession();
  const email = session?.user?.email;

  return (
    <div className="w-full px-4 py-4">
      <div className="flex flex-col items-center gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-4">
        {/* 左カラム: 中央寄せのバランス用 */}
        <div className="hidden lg:block" aria-hidden="true" />
        <PageNavLinks />
        {email ? (
          <form
            action={signOutAction}
            className="flex items-center justify-center gap-2 lg:justify-end"
          >
            <h2 className="whitespace-nowrap text-sm">ユーザID: {email}</h2>
            <button className="gsi-material-button" disabled={offlineMode}>
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <span className="gsi-material-button-contents">ログアウト</span>
                <span style={{ display: "none" }}>ログアウト</span>
              </div>
            </button>
          </form>
        ) : (
          <div className="hidden lg:block" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

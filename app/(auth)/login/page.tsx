import { signIn } from "@/auth";
import { getUserSession, isClosedMode } from "@/lib/sessionManager";
import { AuroraText } from "@/components/ui/aurora-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShineBorder } from "@/components/ui/shine-border";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const offlineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";
  const session = await getUserSession();
  const closedMode = isClosedMode();

  return (
    <>
      {session == null && (
        <div className="flex flex-col justify-center items-center min-h-screen py-2 space-y-4">
          <Card className="relative w-full max-w-[350px] overflow-hidden items-center">
            <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
            <CardContent>
              <Image src="/icon.svg" width={120} height={120} alt="" />
              <CardTitle className="text-3xl font-bold tracking-tighter">
                <AuroraText>PhotoBlog</AuroraText>
              </CardTitle>
              {closedMode && (
                <div className="text-xl font-bold tracking-tighter text-center">
                  Closed Mode
                </div>
              )}
            </CardContent>
            <CardContent>
              <div>続行することにより、</div>
              <div>
                <Link
                  href={"/terms"}
                  className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                >
                  利用規約
                </Link>
                に同意したものとみなします。
              </div>
            </CardContent>
            <CardFooter>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/home" });
                }}
              >
                <button
                  className="w-full gsi-material-button"
                  disabled={offlineMode}
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        style={{ display: "block" }}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        ></path>
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        ></path>
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        ></path>
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        ></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      Google でログイン
                    </span>
                    <span style={{ display: "none" }}>Google でログイン</span>
                  </div>
                </button>
              </form>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}

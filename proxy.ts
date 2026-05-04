import { getUserSession, isAllowedEmail } from "./lib/sessionManager";
import { NextResponse } from "next/server";

export async function proxy(request: { url: string | URL | undefined }) {
  const testMode = process.env.TEST_MODE === "true";
  if (testMode) {
    console.log("Test Mode: Enabled");
  }

  console.log("request.url: ", request.url);

  const session = await getUserSession();
  if (!session) {
    if (
      String(request.url).match(/^.+terms$/) ||
      String(request.url).match(/^.+login$/)
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAllowed = isAllowedEmail(session?.user?.email || "");
  if (!isAllowed) {
    if (String(request.url).match(/^.+invalid-email$/)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/invalid-email", request.url));
  }

  if (
    String(request.url).match(/^.+login/) ||
    String(request.url).match(/^.+\/$/)
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // テストモードのみアクセス可能なページの制御
  if (!testMode) {
    if (String(request.url).match(/^.+test/)) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.json).*)",
  ],
};

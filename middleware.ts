import { NextResponse } from "next/server";
import { auth } from "./auth";

export async function middleware(request: { url: string | URL | undefined }) {
  console.log("request.url: ", request.url);

  const session = await auth();
  if (!session) {
    if (String(request.url).match(/^.+login$/)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    String(request.url).match(/^.+login$/) ||
    String(request.url).match(/^.+\/$/)
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

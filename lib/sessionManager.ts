import { auth } from "@/auth";
import { Session } from "next-auth";

export async function getUserSession(): Promise<Session | null> {
  const offlineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";
  if (offlineMode) {
    return {
      user: {
        id: "offline-user-id",
        name: "Offline User",
        email: "offline@example.com",
        image: null,
      },
      expires: "9999-12-31T23:59:59.999Z",
    };
  }

  const session = await auth();

  return session;
}

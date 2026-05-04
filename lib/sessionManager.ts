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

/**
 * サービスがクローズドモードか判定する
 * @returns サービスがクローズドモードか
 */
export function isClosedMode(): boolean {
  // 許可されたメールアドレスのリストを取得
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];

  return allowedEmails.length > 0;
}

/**
 * メールアドレスが許可リストに存在するか検証する（オフラインモードは常に許可）
 * @param {string} email メールアドレス
 * @returns {boolean} メールアドレスが有効か
 */
export function isAllowedEmail(email: string): boolean {
  const offlineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === "true";

  if (offlineMode) {
    return true;
  }

  // 許可されたメールアドレスのリストを取得
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];

  // メールアドレスが許可されているか確認
  const isAllowed = allowedEmails.length === 0 || allowedEmails.includes(email);

  return isAllowed;
}

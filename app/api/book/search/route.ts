import { getUserSession } from "@/lib/sessionManager";
import {
  CmsBooks,
  convertToBooks,
  isAllowedUser,
} from "@/types/microCMS/book";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const session = await getUserSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  const searchParams = _req.nextUrl.searchParams;
  const limit = (searchParams.get("limit") as string) || undefined;
  const offset = (searchParams.get("offset") as string) || undefined;
  // scope=all の場合、閲覧権限のあるブック全てを返す
  const includeViewable = searchParams.get("scope") === "all";

  console.log("limit: ", limit);
  console.log("offset: ", offset);

  const filters = includeViewable
    ? ""
    : `filters=ownerUserId[equals]${session.user?.email}&`;

  // microCMSからデータを取得
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book?${filters}orders=-updatedAt&limit=${limit}&offset=${offset}`,
    {
      method: "GET",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
      },
    },
  );

  if (!res.ok) {
    return new Response("Failed to fetch book data", { status: res.status });
  }

  const data = (await res.json()) as CmsBooks;

  // 閲覧権限のあるブックのみに絞り込む
  if (includeViewable) {
    const email = session.user?.email ?? "";
    data.contents = data.contents.filter(
      (book) => !book.isPrivate || isAllowedUser(book, email),
    );
  }

  const response = convertToBooks(data, session.user?.email ?? "");

  return Response.json(response);
}

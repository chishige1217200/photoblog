import { buildAllScopeFilters, parseVisibility } from "@/lib/bookVisibility";
import { getUserSession } from "@/lib/sessionManager";
import { parseKeyword, parseLimit, parseOffset } from "@/lib/searchParams";
import { CmsBooks, convertToBooks } from "@/types/microCMS/book";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const session = await getUserSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  const searchParams = _req.nextUrl.searchParams;
  const limit = parseLimit(searchParams.get("limit"));
  const offset = parseOffset(searchParams.get("offset"));
  // キーワード検索（q）
  const keyword = parseKeyword(searchParams.get("q"));
  // scope=all の場合、閲覧権限のあるブック全てを返す
  const includeViewable = searchParams.get("scope") === "all";

  const email = session.user?.email ?? "";
  // 公開条件（ホーム画面の scope=all で絞り込み可能）
  const visibilities = includeViewable
    ? parseVisibility(searchParams)
    : [];
  // scope=all の場合は「公開中 or 自分自身 or 限定公開リストに含まれる」ブックのみをmicroCMS側で絞り込む
  const filters = includeViewable
    ? buildAllScopeFilters(email, visibilities)
    : `ownerUserId[equals]${email}`;

  // microCMSからデータを取得
  const url = new URL(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book`,
  );
  url.searchParams.set("filters", filters);
  if (keyword) url.searchParams.set("q", keyword);
  url.searchParams.set("orders", "-updatedAt");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return new Response("Failed to fetch book data", { status: res.status });
  }

  const data = (await res.json()) as CmsBooks;

  const response = convertToBooks(data, session.user?.email ?? "");

  return Response.json(response);
}

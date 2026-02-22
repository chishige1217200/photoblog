import { getUserSession } from "@/lib/sessionManager";
import { CmsBook, convertToBook } from "@/types/microCMS/book";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/photo/search/[id]">,
) {
  const session = await getUserSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  const { id } = await ctx.params;
  if (!id) {
    return new Response("Photo ID is required", { status: 400 });
  }

  // microCMSからデータを取得
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/photo/${id}`,
    {
      method: "GET",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
      },
    },
  );

  if (!res.ok) {
    return new Response("Failed to fetch photo data", { status: res.status });
  }

  const data = (await res.json()) as CmsBook;
  console.log(data);

  const response = convertToBook(data, session.user?.email ?? "");

  return Response.json(response);
}

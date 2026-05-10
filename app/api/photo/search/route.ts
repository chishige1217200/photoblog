import { getUserSession } from "@/lib/sessionManager";
import { CmsPhotos, convertToPhotos } from "@/types/microCMS/photo";
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

  console.log("limit: ", limit);
  console.log("offset: ", offset);

  // microCMSからデータを取得
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/photo?filters=ownerUserId[equals]${session.user?.email}&orders=-updatedAt&limit=${limit}&offset=${offset}`,
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

  const data = (await res.json()) as CmsPhotos;

  const response = convertToPhotos(data, session.user?.email ?? "");

  return Response.json(response);
}

import { auth } from "@/auth";
import { CmsPhotos, convertToPhotos } from "@/types/microCMS/photo";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  // microCMSからデータを取得
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/photo?filters=ownerUserId[equals]${session.user?.email}&orders=-updatedAt`,
    {
      method: "GET",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
      },
    },
  );

  const data = await res.json() as CmsPhotos;
  console.log(data);

  const response = convertToPhotos(data, session.user?.email ?? undefined);

  return Response.json(response);
}

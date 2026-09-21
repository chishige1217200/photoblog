import { getUserSession } from "@/lib/sessionManager";
import { CmsBook, isCollaborator } from "@/types/microCMS/book";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/book/[id]/photo/[photoId]">,
) {
  const session = await getUserSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  const { id, photoId } = await ctx.params;
  if (!id) {
    return new Response("Book ID is required", { status: 400 });
  }
  if (!photoId) {
    return new Response("Photo ID is required", { status: 400 });
  }

  // 既存のブックを取得し、編集権限を確認
  const existingRes = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book/${id}`,
    {
      method: "GET",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
      },
    },
  );

  if (!existingRes.ok) {
    return new Response("Failed to fetch book data", { status: existingRes.status });
  }

  const existingBook: CmsBook = await existingRes.json();
  if (!isCollaborator(existingBook, session.user?.email ?? "")) {
    return new Response("You don't have permission to perform this action", {
      status: 403,
    });
  }

  // 既存のphotographs（フォトID配列）から削除対象を除去
  const existingPhotoIds = (existingBook.photographs ?? []).map(
    (photo) => photo.id,
  );
  if (!existingPhotoIds.includes(photoId)) {
    return new Response("Photo not found in this book", { status: 404 });
  }

  const photographs = existingPhotoIds.filter((pid) => pid !== photoId);

  // photographsのみを更新（複数コンテンツ参照は参照先コンテンツのID配列で指定）
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book/${id}`,
    {
      method: "PATCH",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photographs }),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Book photo remove error:", error);
    return new Response(error, { status: res.status });
  }

  const resData = await res.json();
  console.log("Book photo remove successful: ", resData.id);

  return Response.json(resData);
}

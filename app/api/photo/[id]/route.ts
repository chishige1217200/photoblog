import { getUserSession } from "@/lib/sessionManager";
import { CmsBook } from "@/types/microCMS/book";
import { CmsPhoto, isOwner } from "@/types/microCMS/photo";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/photo/[id]">,
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

  const headers = {
    "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
  };

  // フォトを取得し、所有権を確認
  const photoRes = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/photo/${id}`,
    { method: "GET", headers },
  );
  if (!photoRes.ok) {
    return new Response("Failed to fetch photo data", { status: photoRes.status });
  }
  const photo: CmsPhoto = await photoRes.json();
  if (!isOwner(photo, session.user?.email ?? "")) {
    return new Response("You don't have permission to perform this action", {
      status: 403,
    });
  }

  // microCMSでは参照されているコンテンツは削除できないため、
  // 自分が所有するブックからこのフォトの参照を先に除去する
  const booksRes = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book?filters=ownerUserId[equals]${session.user?.email}&limit=100`,
    { method: "GET", headers },
  );
  if (booksRes.ok) {
    const booksData = (await booksRes.json()) as { contents: CmsBook[] };
    for (const book of booksData.contents) {
      const photoIds = (book.photographs ?? []).map((p) => p.id);
      if (photoIds.includes(id)) {
        const remaining = photoIds.filter((pid) => pid !== id);
        const patchRes = await fetch(
          `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book/${book.id}`,
          {
            method: "PATCH",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ photographs: remaining }),
          },
        );
        if (!patchRes.ok) {
          console.error("Failed to remove photo from book:", book.id);
        }
      }
    }
  }

  // フォトを削除
  const deleteRes = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/photo/${id}`,
    { method: "DELETE", headers },
  );
  if (!deleteRes.ok) {
    const error = await deleteRes.text();
    console.error("Photo delete error:", error);
    return new Response(error, { status: deleteRes.status });
  }

  return Response.json({ id });
}

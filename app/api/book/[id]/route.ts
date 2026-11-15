import { getUserSession } from "@/lib/sessionManager";
import { CmsBook, isOwner } from "@/types/microCMS/book";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/book/[id]">,
) {
  const session = await getUserSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  const { id } = await ctx.params;
  if (!id) {
    return new Response("Book ID is required", { status: 400 });
  }

  const headers = {
    "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
  };

  // ブックを取得し、所有権を確認
  const bookRes = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book/${id}`,
    { method: "GET", headers },
  );
  if (!bookRes.ok) {
    return new Response("Failed to fetch book data", { status: bookRes.status });
  }
  const book: CmsBook = await bookRes.json();
  if (!isOwner(book, session.user?.email ?? "")) {
    return new Response("You don't have permission to perform this action", {
      status: 403,
    });
  }

  // ブックを削除
  const deleteRes = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book/${id}`,
    { method: "DELETE", headers },
  );
  if (!deleteRes.ok) {
    const error = await deleteRes.text();
    console.error("Book delete error:", error);
    return new Response(error, { status: deleteRes.status });
  }

  return Response.json({ id });
}

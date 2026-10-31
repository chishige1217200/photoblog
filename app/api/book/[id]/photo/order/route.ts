import { getUserSession } from "@/lib/sessionManager";
import { CmsBook, isCollaborator } from "@/types/microCMS/book";

type OrderRequestBody = {
  photographs?: string[];
};

export async function PUT(
  req: Request,
  ctx: RouteContext<"/api/book/[id]/photo/order">,
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

  let body: OrderRequestBody;
  try {
    body = (await req.json()) as OrderRequestBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const orderedPhotoIds = body.photographs;
  if (!Array.isArray(orderedPhotoIds)) {
    return new Response("photographs must be an array of photo IDs", {
      status: 400,
    });
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

  // 送信されたID列が既存フォトと同じ集合（並び替えのみ）であることを確認
  const existingPhotoIds = (existingBook.photographs ?? []).map(
    (photo) => photo.id,
  );
  const isSameSet =
    orderedPhotoIds.length === existingPhotoIds.length &&
    new Set(orderedPhotoIds).size === existingPhotoIds.length &&
    orderedPhotoIds.every((photoId) => existingPhotoIds.includes(photoId));
  if (!isSameSet) {
    return new Response(
      "photographs must be a reorder of the photos in this book",
      { status: 400 },
    );
  }

  // photographsのみを更新（複数コンテンツ参照は参照先コンテンツのID配列で指定）
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book/${id}`,
    {
      method: "PATCH",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photographs: orderedPhotoIds }),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Book photo reorder error:", error);
    return new Response(error, { status: res.status });
  }

  const resData = await res.json();
  console.log("Book photo reorder successful: ", resData.id);

  return Response.json(resData);
}

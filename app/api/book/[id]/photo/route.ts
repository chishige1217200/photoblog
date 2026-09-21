import { getUserSession } from "@/lib/sessionManager";
import { CmsBook, isCollaborator } from "@/types/microCMS/book";
import sharp from "sharp";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/book/[id]/photo">,
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

  // FormDataの読み取り
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return new Response("No file provided", { status: 400 });
  }
  const title: string | undefined =
    (formData.get("title") as string) || undefined;
  const caption: string | undefined =
    (formData.get("caption") as string) || undefined;
  const shotAt: string | undefined =
    (formData.get("shotAt") as string) || undefined;

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

  // sharpでEXIFを除去し、寸法を取得
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const metadata = await sharp(buffer).metadata();
  const noExifBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

  // microCMSにアップロード
  const uploadForm = new FormData();
  uploadForm.append(
    "file",
    new Blob([new Uint8Array(noExifBuffer)], { type: "image/jpeg" }),
    file.name,
  );

  const uploadRes = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms-management.io/api/v1/media`,
    {
      method: "POST",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
      },
      body: uploadForm,
    },
  );

  if (!uploadRes.ok) {
    const error = await uploadRes.text();
    console.error("Upload error:", error);
    return new Response(error, { status: uploadRes.status });
  }

  const uploadResData = (await uploadRes.json()) as { url: string };
  console.log("Upload success: ", uploadResData.url);

  // 新規フォトを構築（システムフィールドはmicroCMSが自動生成するため除外）
  const newPhoto = {
    photograph: {
      url: uploadResData.url,
      height: metadata.height ?? 0,
      width: metadata.width ?? 0,
    },
    title,
    caption,
    shotAt,
    ownerUserId: session.user?.email,
  };

  // 既存のphotographs配列に追加（システムフィールドを除外してコンテンツフィールドのみを送信）
  const photographs = [
    ...(existingBook.photographs ?? []).map((photo) => ({
      photograph: photo.photograph,
      title: photo.title,
      caption: photo.caption,
      shotAt: photo.shotAt,
      ownerUserId: photo.ownerUserId,
    })),
    newPhoto,
  ];

  // コンテンツフィールドのみを送信（システムフィールドは除外）
  const bookData = {
    title: existingBook.title,
    subTitle: existingBook.subTitle,
    author: existingBook.author,
    thumbnail: existingBook.thumbnail,
    photographs,
    isPrivate: existingBook.isPrivate,
    allowUserIds: existingBook.allowUserIds,
    collaborateUserIds: existingBook.collaborateUserIds,
    ownerUserId: existingBook.ownerUserId,
  };

  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book/${id}`,
    {
      method: "PATCH",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookData),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Book photo add error:", error);
    return new Response(error, { status: res.status });
  }

  const resData = await res.json();
  console.log("Book photo add successful: ", resData.id);

  return Response.json(resData);
}

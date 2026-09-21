import { getUserSession } from "@/lib/sessionManager";
import {
  CmsBook,
  convertFromList,
  isCollaborator,
} from "@/types/microCMS/book";
import { UploadImageResponse } from "@/types/microCMS/image";
import sharp from "sharp";

export async function POST(req: Request) {
  const session = await getUserSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  const formData = await req.formData();
  const id: string | undefined =
    (formData.get("id") as string) || undefined;
  if (!id) {
    return new Response("Book ID is required", { status: 400 });
  }

  const title: string | undefined =
    (formData.get("title") as string) || undefined;
  const subTitle: string | undefined =
    (formData.get("subTitle") as string) || undefined;
  const author: string | undefined =
    (formData.get("author") as string) || undefined;
  const isPrivate = formData.get("isPrivate") === "true";
  const viewers = formData.getAll("viewers") as string[];
  const editors = formData.getAll("editors") as string[];
  const file = formData.get("file") as File | null;

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

  // サムネイルが更新された場合のみアップロード
  let thumbnail = existingBook.thumbnail?.url;
  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const noExifBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

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
      console.error("Thumbnail upload error:", error);
      return new Response(error, { status: uploadRes.status });
    }

    const uploadResData: UploadImageResponse = await uploadRes.json();
    thumbnail = uploadResData.url;
  }

  const bookData = {
    title,
    subTitle,
    author,
    thumbnail,
    isPrivate,
    allowUserIds: convertFromList(viewers),
    collaborateUserIds: convertFromList(editors),
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
    console.error("Book update error:", error);
    return new Response(error, { status: res.status });
  }

  const resData = await res.json();
  console.log("Book update successful: ", resData.id);

  return Response.json(resData);
}

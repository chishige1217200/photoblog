import { getUserSession } from "@/lib/sessionManager";
import { convertFromList } from "@/types/microCMS/book";
import { UploadImageResponse } from "@/types/microCMS/image";
import { CmsPhoto, RegistCmsPhoto, isOwner } from "@/types/microCMS/photo";
import sharp from "sharp";

export async function POST(req: Request) {
  const session = await getUserSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!process.env.MICROCMS_SERVICE_DOMAIN)
    return new Response("MICROCMS_SERVICE_DOMAIN is required", { status: 500 });
  if (!process.env.MICROCMS_API_KEY)
    return new Response("MICROCMS_API_KEY is required", { status: 500 });

  // FormDataの読み取り
  const formData = await req.formData();
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
  // file: 新規アップロード / thumbnailPhotoId: アップロード済みフォトの参照指定
  const thumbnailPhotoId: string | undefined =
    (formData.get("thumbnailPhotoId") as string) || undefined;

  if (!title) {
    return new Response("Title is required", { status: 400 });
  }
  if (!file && !thumbnailPhotoId) {
    return new Response("Thumbnail is required", { status: 400 });
  }

  // サムネイル画像のURLを決める（新規アップロード or 既存フォト参照）
  let thumbnail: string;

  if (thumbnailPhotoId) {
    // 既存フォトを参照してサムネイルに使用（フォトデータの再登録はしない）
    const photoRes = await fetch(
      `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/photo/${thumbnailPhotoId}`,
      {
        method: "GET",
        headers: {
          "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
        },
      },
    );

    if (!photoRes.ok) {
      const error = await photoRes.text();
      console.error("Photo fetch error:", error);
      return new Response("Failed to fetch photo data", {
        status: photoRes.status,
      });
    }

    const photo: CmsPhoto = await photoRes.json();
    if (!isOwner(photo, session.user?.email || undefined)) {
      return new Response("You don't have permission to perform this action", {
        status: 403,
      });
    }
    if (!photo.photograph?.url) {
      return new Response("Photo has no image", { status: 400 });
    }

    thumbnail = photo.photograph.url;
    console.log("Thumbnail from existing photo: ", thumbnailPhotoId);
  } else {
    // 新規アップロード：sharpでEXIFを除去
    const arrayBuffer = await file!.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const noExifBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

    // サムネイルをmicroCMSにアップロード
    const uploadForm = new FormData();
    uploadForm.append(
      "file",
      new Blob([new Uint8Array(noExifBuffer)], { type: "image/jpeg" }),
      file!.name,
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
    console.log("Thumbnail upload success: ", uploadResData.url);
    thumbnail = uploadResData.url;

    // サムネイルに選択した画像もフォトデータとして登録
    const photoData: RegistCmsPhoto = {
      photograph: uploadResData.url,
      title,
      ownerUserId: session.user?.email ?? undefined,
    };

    const photoRes = await fetch(
      `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/photo`,
      {
        method: "POST",
        headers: {
          "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(photoData),
      },
    );

    if (!photoRes.ok) {
      const error = await photoRes.text();
      console.error("Thumbnail photo registration error:", error);
      return new Response(error, { status: photoRes.status });
    }

    const photoResData = await photoRes.json();
    console.log("Thumbnail photo registration successful: ", photoResData.id);
  }

  // bookAPIでデータ登録
  const bookData = {
    title,
    subTitle,
    author,
    thumbnail,
    photographs: [],
    isPrivate,
    allowUserIds: convertFromList(viewers),
    collaborateUserIds: convertFromList(editors),
    ownerUserId: session.user?.email,
  };

  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/book`,
    {
      method: "POST",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookData),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error("Book creation error:", error);
    return new Response(error, { status: res.status });
  }

  const resData = await res.json();
  console.log("Book creation successful: ", resData.id);

  return Response.json(resData);
}

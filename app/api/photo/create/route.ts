import { getUserSession } from "@/lib/sessionManager";
import { UploadImageResponse } from "@/types/microCMS/image";
import { RegistCmsPhoto } from "@/types/microCMS/photo";
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
  const file = formData.get("file") as File;
  if (!file) {
    return new Response("No file provided", { status: 400 });
  }
  const title: string | undefined =
    (formData.get("title") as string) || undefined;
  const caption: string | undefined =
    (formData.get("caption") as string) || undefined;
  const shotAt: string | undefined =
    (formData.get("shotAt") as string) || undefined;
  const ownerUserId: string | undefined = session.user?.email || undefined;

  // sharpでEXIFを除去
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const noExifBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

  // microCMS送信用のFormDataを作成
  const uploadForm = new FormData();
  uploadForm.append(
    "file",
    new Blob([new Uint8Array(noExifBuffer)], { type: "image/jpeg" }),
    file.name,
  );

  // microCMSにデータを送信
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

  const uploadResData: UploadImageResponse = await uploadRes.json();
  console.log("Upload success: ", uploadResData.url);

  // photoAPIでデータ登録
  const photoData: RegistCmsPhoto = {
    photograph: uploadResData.url,
    title: title,
    caption: caption,
    shotAt: shotAt,
    ownerUserId: ownerUserId,
  };

  const res = await fetch(
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

  if (!res.ok) {
    const error = await res.text();
    console.error("Photo registration error:", error);
    return new Response(error, { status: res.status });
  }

  const resData = await res.json();
  console.log("Photo registration successful: ", resData.id);

  return Response.json(resData);
}

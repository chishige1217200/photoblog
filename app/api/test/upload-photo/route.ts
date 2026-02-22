import { getUserSession } from "@/lib/sessionManager";
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

  // sharpでEXIFを除去
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const noExifBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

  // microCMS送信用のFormDataを作成
  const microcmsForm = new FormData();
  microcmsForm.append(
    "file",
    new Blob([new Uint8Array(noExifBuffer)], { type: "image/jpeg" }),
    file.name,
  );

  // microCMSにデータを送信
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms-management.io/api/v1/media`,
    {
      method: "POST",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
      },
      body: microcmsForm,
    },
  );

  if (!res.ok) {
    const error = await res.text();
    return new Response(error, { status: res.status });
  }

  const data = await res.json();
  // console.log(data);

  return Response.json(data);
}

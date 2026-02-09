import { auth } from "@/auth";
import sharp from "sharp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  // ① File → Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ② sharp で EXIF を除去
  const noExifBuffer = await sharp(buffer)
    .jpeg({ quality: 90 })
    .withMetadata({ exif: undefined })
    .toBuffer();

  // ③ microCMS 送信用の FormData 作成
  const microcmsForm = new FormData();

  microcmsForm.append(
    "file",
    new Blob([new Uint8Array(noExifBuffer)], { type: "image/jpeg" }),
    file.name
  );

  // ④ microCMS メディアAPIへ送信
  const res = await fetch(
    `https://${process.env.MICROCMS_SERVICE_DOMAIN}.microcms-management.io/api/v1/media`,
    {
      method: "POST",
      headers: {
        "X-MICROCMS-API-KEY": process.env.MICROCMS_API_KEY!,
      },
      body: microcmsForm,
    }
  );

  if (!res.ok) {
    const error = await res.text();
    return new Response(error, { status: res.status });
  }

  const data = await res.json();

  // microCMS から返ってくるのはこういうデータ
  // { url: "..." }

  return Response.json(data);
}


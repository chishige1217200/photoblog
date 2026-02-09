"use client";

import { useState } from "react";

export default function UploadPhoto() {
  const [result, setResult] = useState<unknown>(null);
  const [file, setFile] = useState<File | null>(null);

  // JSON API 呼び出し
  const callJsonApi = async () => {
    const res = await fetch("/api/photos");

    const data = await res.json();
    setResult(data);
  };

  // ファイルアップロードAPI 呼び出し
  const uploadFile = async () => {
    if (!file) return alert("ファイルを選択してください");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/test/upload-photo", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Next.js Front → Backend API サンプル</h1>

      <h2>JSON API 呼び出し</h2>
      <button onClick={callJsonApi}>
        JSON API を呼び出す
      </button>

      <hr />

      <h2>ファイルアップロード</h2>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={uploadFile}>
        アップロード
      </button>

      <hr />

      <h2>結果</h2>
      <pre>{result ? JSON.stringify(result, null, 2) : "未実行"}</pre>
    </div>
  );
}

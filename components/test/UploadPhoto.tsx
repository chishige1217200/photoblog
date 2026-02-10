"use client";

import { useState } from "react";

export default function UploadPhoto() {
  const [result, setResult] = useState<unknown>(null);
  const [file, setFile] = useState<File | null>(null);

  // JSON API 呼び出し
  const callJsonApi = async () => {
    const res = await fetch("/api/photo");

    if (!res.ok) {
      const error = await res.text();
      return alert(`JSON API 呼び出し失敗: ${error}`);
    }

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

    if (!res.ok) {
      const error = await res.text();
      return alert(`ファイルアップロードAPI 呼び出し失敗: ${error}`);
    }

    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="font-medium text-zinc-950 dark:text-zinc-50">
          Next.js Front → Backend API サンプル
        </h1>

        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
          JSON API 呼び出し
        </h2>
        <button
          className="font-medium text-zinc-950 dark:text-zinc-50 border-2 px-3 py-1 rounded-2xl border-zinc-300 dark:border-zinc-700"
          onClick={callJsonApi}
        >
          JSON API を呼び出す
        </button>

        <hr />

        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">
          ファイルアップロード
        </h2>
        <input
          className="font-medium text-zinc-950 dark:text-zinc-50 border-2 px-3 py-1 rounded-2xl border-zinc-300 dark:border-zinc-700"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <br />
        <button
          className="font-medium text-zinc-950 dark:text-zinc-50 border-2 px-3 py-1 rounded-2xl border-zinc-300 dark:border-zinc-700"
          onClick={uploadFile}
        >
          アップロード
        </button>

        <hr />

        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">結果</h2>
        <pre className="font-medium text-zinc-950 dark:text-zinc-50 w-full overflow-auto">
          {result ? JSON.stringify(result, null, 2) : "未実行"}
        </pre>
      </main>
    </div>
  );
}

"use client";
import React, { useState } from "react";

function PreviewPhoto() {
  const [image, setImage] = useState<string | null>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="font-medium text-zinc-950 dark:text-zinc-50">
          Next.js Front → Backend API サンプル
        </h1>
        <div className="flex flex-col items-center">
          <input
            className="font-medium text-zinc-950 dark:text-zinc-50 border-2 px-3 py-1 rounded-2xl border-zinc-300 dark:border-zinc-700"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {image && (
            <img
              src={image}
              alt="Preview"
              style={{ width: "200px", marginTop: "10px" }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
export default PreviewPhoto;

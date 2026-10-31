"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Photo } from "@/types/PhotoBlog/photo";
import PhotoForm from "./PhotoForm";

type Props = {
  id: string;
};

/**
 * フォト一覧から開くフォト編集ページ。
 * フォーム自体はブック編集画面のフォト編集ダイアログと共通化している。
 */
export default function PhotoEditor({ id }: Props) {
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadPhoto = async (photoId: string) => {
      try {
        const res = await fetch(`/api/photo/search/${photoId}`);
        if (!res.ok) {
          setHasError(true);
          return;
        }
        setPhoto((await res.json()) as Photo);
      } catch (err) {
        console.error(err);
        setHasError(true);
      }
    };
    loadPhoto(id);
  }, [id]);

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">このフォトを編集できません。</p>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">フォトを編集</h1>
      <PhotoForm
        key={photo.id}
        photoId={photo.id}
        initialTitle={photo.title ?? ""}
        initialCaption={photo.caption ?? ""}
        // date入力欄はYYYY-MM-DD形式を要求するため、日付部分のみを渡す
        initialShotAt={photo.shotAt?.slice(0, 10) ?? ""}
        initialImageUrl={photo.photograph?.url}
        onSuccess={() => router.push("/photo")}
      />
    </div>
  );
}

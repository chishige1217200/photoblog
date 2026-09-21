"use client";
import "@/styles/photoboard.css";
import { Button, HStack } from "@chakra-ui/react";
import { Photo } from "@/types/PhotoBlog/photo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toaster } from "./ui/toaster";

export default function PhotoBoard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    const res = await fetch("/api/photo/search?limit=100");
    if (res.ok) {
      const data = (await res.json()) as { contents: Photo[] };
      setPhotos(data.contents);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("このフォトを削除しますか？")) {
      return;
    }
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/photo/${photoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toaster.create({
          title: "フォトを削除しました",
          type: "success",
          closable: true,
        });
        await fetchPhotos();
      } else {
        const error = await res.text();
        toaster.create({
          title: "削除に失敗しました",
          description: error,
          type: "error",
          closable: true,
        });
      }
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "エラーが発生しました",
        type: "error",
        closable: true,
      });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  return (
    <div className="bookshelf">
      {loading ? (
        <p className="title">読み込み中...</p>
      ) : (
        photos.map((photo) => (
          <div key={photo.id} className="book-item">
            <div className="book">
              {photo.photograph?.url ? (
                <img src={photo.photograph.url} alt={photo.title ?? ""} />
              ) : (
                <div className="book" />
              )}
            </div>
            <p className="title">{photo.title ?? "無題"}</p>
            {photo.isOwner && (
              <HStack gap="2" mt="2">
                <Link
                  href={`/photo/edit/${photo.id}`}
                  className="inline-block rounded-full border border-zinc-300 px-3 py-1 text-xs transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  編集
                </Link>
                <Button
                  size="xs"
                  colorPalette="red"
                  variant="outline"
                  loading={deletingPhotoId === photo.id}
                  onClick={() => handleDeletePhoto(photo.id)}
                >
                  削除
                </Button>
              </HStack>
            )}
          </div>
        ))
      )}
    </div>
  );
}

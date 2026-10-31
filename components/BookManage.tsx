"use client";

import { Book } from "@/types/PhotoBlog/book";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, HStack } from "@chakra-ui/react";
import { toaster } from "./ui/toaster";

type Props = {
  id: string;
};

export default function BookManage({ id }: Props) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [hasError, setHasError] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [deletingBook, setDeletingBook] = useState(false);

  const refreshBook = useCallback(async () => {
    const res = await fetch(`/api/book/search/${id}`);
    if (!res.ok) {
      setHasError(true);
      return;
    }
    setBook((await res.json()) as Book);
  }, [id]);

  useEffect(() => {
    refreshBook();
  }, [refreshBook]);

  const handleDeleteBook = async () => {
    if (
      !window.confirm(
        "このブックを削除しますか？\n（ブック内のフォトはフォトボードに残ります）",
      )
    ) {
      return;
    }
    setDeletingBook(true);
    try {
      const res = await fetch(`/api/book/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toaster.create({
          title: "ブックを削除しました",
          type: "success",
          closable: true,
        });
        router.push("/book");
      } else {
        const error = await res.text();
        toaster.create({
          title: "削除に失敗しました",
          description: error,
          type: "error",
          closable: true,
        });
        setDeletingBook(false);
      }
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "エラーが発生しました",
        type: "error",
        closable: true,
      });
      setDeletingBook(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("このフォトをブックから削除しますか？")) {
      return;
    }
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/book/${id}/photo/${photoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toaster.create({
          title: "フォトを削除しました",
          type: "success",
          closable: true,
        });
        await refreshBook();
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

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">このブックを管理できません。</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">読み込み中...</p>
      </div>
    );
  }

  if (!book.isOwner && !book.isCollaborator) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">このブックを管理する権限がありません。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="mb-4 text-2xl font-bold">ブックを管理</h1>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
        ブック: {book.title ?? "無題"}
      </p>
      <HStack gap="2" mb="6" wrap="wrap" justify="center">
        <Button asChild size="sm" variant="outline" borderRadius="full">
          <Link href={`/book/${id}`}>閲覧に戻る</Link>
        </Button>
        <Button asChild size="sm" variant="outline" borderRadius="full">
          <Link href={`/book/${id}/photo/add`}>フォトを追加</Link>
        </Button>
        {book.isOwner && (
          <Button
            size="sm"
            variant="outline"
            colorPalette="red"
            loading={deletingBook}
            onClick={handleDeleteBook}
          >
            ブックを削除
          </Button>
        )}
      </HStack>

      {book.photographs && book.photographs.length > 0 ? (
        <div className="w-full max-w-3xl">
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            削除したいフォトを選択してください。
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {book.photographs.map((photo) => (
              <div
                key={photo.id}
                className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                {photo.photograph?.url ? (
                  <Image
                    src={photo.photograph.url}
                    alt={photo.title ?? ""}
                    width={photo.photograph.width}
                    height={photo.photograph.height}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-zinc-100 text-2xl dark:bg-zinc-800">
                    ?
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1">
                  <p className="truncate text-xs text-white">
                    {photo.title ?? "無題"}
                  </p>
                </div>
                <Button
                  size="xs"
                  colorPalette="red"
                  className="absolute right-1 top-1"
                  loading={deletingPhotoId === photo.id}
                  onClick={() => handleDeletePhoto(photo.id)}
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          このブックにフォトは登録されていません。
        </p>
      )}
    </div>
  );
}

"use client";
import { GetWindowSize } from "@/hook/GetWindowSize";
import { Book } from "@/types/PhotoBlog/book";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, HStack } from "@chakra-ui/react";
import BookPhotoForm from "./BookPhotoForm";
import { toaster } from "./ui/toaster";

const PhotoBook = dynamic(() => import("./PhotoBook"), {
  ssr: false,
});

type Props = {
  id: string;
};

export default function BookView({ id }: Props) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [showDeleteMode, setShowDeleteMode] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [deletingBook, setDeletingBook] = useState(false);

  const refreshBook = async () => {
    const res = await fetch(`/api/book/search/${id}`);
    if (res.ok) {
      setBook((await res.json()) as Book);
    }
  };

  const handleDeleteBook = async () => {
    if (!window.confirm("このブックを削除しますか？\n（ブック内のフォトはフォトボードに残ります）")) {
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

  useEffect(() => {
    const fetchBook = async () => {
      const res = await fetch(`/api/book/search/${id}`);
      if (!res.ok) {
        setError(true);
        return;
      }
      setBook((await res.json()) as Book);
    };
    fetchBook();
  }, [id]);

  const { width, height } = GetWindowSize();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">このブックを表示できません。</p>
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

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 text-center">
        {(book.isOwner || book.isCollaborator) && (
          <HStack gap="2" mt="2">
            <Link
              href={`/book/edit/${id}`}
              className="inline-block rounded-full border border-zinc-300 px-4 py-1 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              編集する
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPhotoForm((v) => !v)}
            >
              {showPhotoForm ? "フォト追加を閉じる" : "フォトを追加"}
            </Button>
            {book.photographs && book.photographs.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={() => setShowDeleteMode((v) => !v)}
              >
                {showDeleteMode ? "削除モードを終了" : "フォトを削除"}
              </Button>
            )}
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
        )}
      </div>
      {showPhotoForm && (book.isOwner || book.isCollaborator) && (
        <div className="mb-4">
          <BookPhotoForm bookId={id} onUploaded={refreshBook} />
        </div>
      )}
      {showDeleteMode &&
        (book.isOwner || book.isCollaborator) &&
        book.photographs &&
        book.photographs.length > 0 && (
          <div className="mb-4 w-full max-w-3xl">
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
        )}
      {book.photographs && book.photographs.length > 0 ? (
        <PhotoBook
          photos={book.photographs}
          book={book}
          width={(width - 32) / 2}
          height={height - 32}
        />
      ) : (
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          まだフォトが登録されていません。
        </p>
      )}
    </div>
  );
}

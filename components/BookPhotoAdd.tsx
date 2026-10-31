"use client";

import { Book } from "@/types/PhotoBlog/book";
import { useCallback, useEffect, useState } from "react";
import BookPhotoForm from "./BookPhotoForm";

type Props = {
  bookId: string;
};

/**
 * フォト追加ページ。
 * 追加済みのフォトを選択肢から除外するため、ブックの現在のフォト一覧を取得する。
 */
export default function BookPhotoAdd({ bookId }: Props) {
  const [book, setBook] = useState<Book | null>(null);
  const [hasError, setHasError] = useState(false);

  const refreshBook = useCallback(async () => {
    const res = await fetch(`/api/book/search/${bookId}`);
    if (!res.ok) {
      setHasError(true);
      return;
    }
    setBook((await res.json()) as Book);
  }, [bookId]);

  useEffect(() => {
    refreshBook();
  }, [refreshBook]);

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">このブックにフォトを追加できません。</p>
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
        <p className="text-lg">このブックにフォトを追加する権限がありません。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="mb-4 text-2xl font-bold">ブックにフォトを追加</h1>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
        ブック: {book.title ?? "無題"}
      </p>
      <BookPhotoForm
        bookId={bookId}
        existingPhotoIds={(book.photographs ?? []).map((photo) => photo.id)}
        onUploaded={refreshBook}
      />
    </div>
  );
}

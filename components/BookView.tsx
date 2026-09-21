"use client";
import { GetWindowSize } from "@/hook/GetWindowSize";
import { Book } from "@/types/PhotoBlog/book";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const PhotoBook = dynamic(() => import("./PhotoBook"), {
  ssr: false,
});

type Props = {
  id: string;
};

export default function BookView({ id }: Props) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState(false);

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
        <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
        {book.subTitle && (
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {book.subTitle}
          </p>
        )}
        {book.author && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            著者: {book.author}
          </p>
        )}
        {(book.isOwner || book.isCollaborator) && (
          <Link
            href={`/book/edit/${id}`}
            className="mt-2 inline-block rounded-full border border-zinc-300 px-4 py-1 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            編集する
          </Link>
        )}
      </div>
      {book.photographs && book.photographs.length > 0 ? (
        <PhotoBook
          photos={book.photographs}
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

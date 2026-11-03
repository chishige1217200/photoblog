"use client";
import { GetWindowSize } from "@/hook/GetWindowSize";
import { Book } from "@/types/PhotoBlog/book";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, HStack } from "@chakra-ui/react";

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
        <h1 className="text-2xl font-bold">{book.title ?? "無題"}</h1>
        {(book.subTitle || book.author) && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {[book.subTitle, book.author].filter(Boolean).join(" / ")}
          </p>
        )}
        {(book.isOwner || book.isCollaborator) && (
          <HStack gap="2" mt="3">
            <Button asChild size="sm" colorPalette="blue">
              <Link href={`/book/edit/${id}`}>編集する</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/book/edit/${id}?tab=photos&add=1`}>
                フォトを追加
              </Link>
            </Button>
          </HStack>
        )}
      </div>
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

"use client";
import "@/styles/bookshelf.css";
import { AbsoluteCenter, Box, Text } from "@chakra-ui/react";
import { Book } from "@/types/PhotoBlog/book";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  // "all" の場合、自分自身のブックだけでなく閲覧権限のあるブック全てを表示する
  scope?: "own" | "all";
};

export default function Bookshelf({ scope = "own" }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const scopeParam = scope === "all" ? "&scope=all" : "";
      const res = await fetch(`/api/book/search?limit=100${scopeParam}`);
      if (res.ok) {
        const data = (await res.json()) as { contents: Book[] };
        setBooks(data.contents);
      }
      setLoading(false);
    };
    fetchBooks();
  }, [scope]);

  return (
    <div className="bookshelf">
      <Link href={`/book/edit`} className="book-item">
        <div className="book">
          <Box position="relative" h="100%">
            <AbsoluteCenter>
              <Text textStyle="6xl">+</Text>
            </AbsoluteCenter>
          </Box>
        </div>
        <p className="title">新規ブック</p>
      </Link>
      {loading ? (
        <p className="title">読み込み中...</p>
      ) : (
        books.map((book) => (
          <Link key={book.id} href={`/book/${book.id}`} className="book-item">
            <div className="book">
              {book.thumbnail?.url ? (
                <Image
                  src={book.thumbnail.url}
                  alt={book.title ?? ""}
                  width={book.thumbnail.width}
                  height={book.thumbnail.height}
                />
              ) : (
                <Box position="relative" h="100%">
                  <AbsoluteCenter>
                    <Text textStyle="4xl">?</Text>
                  </AbsoluteCenter>
                </Box>
              )}
            </div>
            <p className="title">{book.title ?? "無題"}</p>
          </Link>
        ))
      )}
    </div>
  );
}

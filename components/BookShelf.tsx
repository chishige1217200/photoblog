"use client";
import "@/styles/bookshelf.css";
import { AbsoluteCenter, Box, Text } from "@chakra-ui/react";
import { Book } from "@/types/PhotoBlog/book";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Bookshelf() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const res = await fetch("/api/book/search?limit=100");
      if (res.ok) {
        const data = (await res.json()) as { contents: Book[] };
        setBooks(data.contents);
      }
      setLoading(false);
    };
    fetchBooks();
  }, []);

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
        <p className="title">New Book</p>
      </Link>
      {loading ? (
        <p className="title">読み込み中...</p>
      ) : (
        books.map((book) => (
          <Link key={book.id} href={`/book/${book.id}`} className="book-item">
            <div className="book">
              {book.thumbnail?.url ? (
                <img src={book.thumbnail.url} alt={book.title ?? ""} />
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

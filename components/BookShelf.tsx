"use client";
import "@/styles/bookshelf.css";
import { AbsoluteCenter, Box, Text } from "@chakra-ui/react";
import { Book, Books } from "@/types/PhotoBlog/book";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SearchToolbar from "./SearchToolbar";

type Props = {
  // "all" の場合、自分自身のブックだけでなく閲覧権限のあるブック全てを表示する
  scope?: "own" | "all";
};

export default function Bookshelf({ scope = "own" }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 絞り込み検索条件
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(12);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String((page - 1) * limit),
    });
    if (keyword) params.set("q", keyword);
    if (scope === "all") params.set("scope", "all");
    let cancelled = false;
    fetch(`/api/book/search?${params.toString()}`)
      .then((res) => (res.ok ? (res.json() as Promise<Books>) : null))
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setBooks(data.contents);
          setTotalCount(data.totalCount);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, keyword, limit, page]);

  return (
    <>
      <SearchToolbar
        onSearch={(nextKeyword) => {
          setLoading(true);
          setKeyword(nextKeyword);
          setPage(1);
        }}
        onPageChange={(nextPage) => {
          setLoading(true);
          setPage(nextPage);
        }}
        onLimitChange={(nextLimit) => {
          setLoading(true);
          setLimit(nextLimit);
        }}
        totalCount={totalCount}
        limit={limit}
        page={page}
        placeholder="タイトルやサブタイトルで絞り込み"
      />
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
        ) : books.length === 0 ? (
          <p className="title">該当するブックがありません</p>
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
    </>
  );
}

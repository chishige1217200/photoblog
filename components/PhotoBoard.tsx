"use client";
import "@/styles/photoboard.css";
import { Button, HStack } from "@chakra-ui/react";
import { Photo, Photos } from "@/types/PhotoBlog/photo";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SearchToolbar from "./SearchToolbar";
import { toaster } from "./ui/toaster";

export default function PhotoBoard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  // 絞り込み検索条件
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(12);
  const [page, setPage] = useState(1);

  // 現在の検索条件でフォトを取得する（setState は行わずデータを返す）
  const fetchPhotos = useCallback(async (): Promise<Photos | null> => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String((page - 1) * limit),
    });
    if (keyword) params.set("q", keyword);
    const res = await fetch(`/api/photo/search?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as Photos;
  }, [keyword, limit, page]);

  useEffect(() => {
    let cancelled = false;
    fetchPhotos()
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setPhotos(data.contents);
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
  }, [fetchPhotos]);

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
        const data = await fetchPhotos();
        if (data) {
          setPhotos(data.contents);
          setTotalCount(data.totalCount);
        }
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
        placeholder="タイトルやキャプションで絞り込み"
      />
      <div className="bookshelf">
        {loading ? (
          <p className="title">読み込み中...</p>
        ) : photos.length === 0 ? (
          <p className="title">該当するフォトがありません</p>
        ) : (
          photos.map((photo) => (
            <div key={photo.id} className="book-item">
              <div className="book">
                {photo.photograph?.url ? (
                  <Image
                    src={photo.photograph.url}
                    alt={photo.title ?? ""}
                    width={photo.photograph.width}
                    height={photo.photograph.height}
                  />
                ) : (
                  <div className="book" />
                )}
              </div>
              <p className="title">{photo.title ?? "無題"}</p>
              {photo.isOwner && (
                <HStack gap="2" mt="2">
                  <Button
                    asChild
                    size="xs"
                    variant="outline"
                    colorPalette="gray"
                  >
                    <Link href={`/photo/edit/${photo.id}`}>編集</Link>
                  </Button>
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
    </>
  );
}

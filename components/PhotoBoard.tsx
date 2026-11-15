"use client";
import "@/styles/photoboard.css";
import { Button, HStack } from "@chakra-ui/react";
import { Photo, Photos } from "@/types/PhotoBlog/photo";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import SearchToolbar from "./SearchToolbar";
import { toaster } from "./ui/toaster";
import { cmsThumbUrl } from "@/lib/microcmsImage";

// カードは 160px 幅・aspect-ratio 4/3（styles/photoboard.css）。
// 2 倍 DPR まで考慮したサイズを CDN 側に生成させ、元画像の読み込みを避ける。
const PHOTO_THUMB_WIDTH = 320;
const PHOTO_THUMB_HEIGHT = 240;

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
      <div className="photo-shelf">
        {loading ? (
          <p className="photo-title">読み込み中...</p>
        ) : photos.length === 0 ? (
          <p className="photo-title">該当するフォトがありません</p>
        ) : (
          photos.map((photo) => (
            <div key={photo.id} className="photo-item">
              <div className="photo">
                {photo.photograph?.url ? (
                  <Image
                    src={cmsThumbUrl(photo.photograph.url, PHOTO_THUMB_WIDTH, {
                      height: PHOTO_THUMB_HEIGHT,
                    })}
                    alt={photo.title ?? ""}
                    width={PHOTO_THUMB_WIDTH}
                    height={PHOTO_THUMB_HEIGHT}
                    unoptimized
                  />
                ) : (
                  <div className="photo" />
                )}
              </div>
              <p className="photo-title">{photo.title ?? "無題"}</p>
              {photo.isOwner && (
                <HStack gap="2" mt="2">
                  <Button
                    asChild
                    size="xs"
                    variant="solid"
                    colorPalette="gray"
                  >
                    <Link href={`/photo/edit/${photo.id}`}>編集</Link>
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="red"
                    variant="solid"
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

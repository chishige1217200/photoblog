"use client";

import { Book } from "@/types/PhotoBlog/book";
import { Photo } from "@/types/PhotoBlog/photo";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HiArrowDown, HiArrowUp, HiPencil } from "react-icons/hi";
import { Button, HStack } from "@chakra-ui/react";
import { toaster } from "./ui/toaster";

type Props = {
  id: string;
};

export default function BookManage({ id }: Props) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  // 表示・並び替え用のフォト配列（ブックの登録順とは異なる可能性がある）
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hasError, setHasError] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [deletingBook, setDeletingBook] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const refreshBook = useCallback(async () => {
    const res = await fetch(`/api/book/search/${id}`);
    if (!res.ok) {
      setHasError(true);
      return;
    }
    const data = (await res.json()) as Book;
    setBook(data);
    setPhotos(data.photographs ?? []);
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

  const movePhoto = (index: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const isOrderDirty =
    photos.length > 0 &&
    (photos.length !== (book?.photographs?.length ?? 0) ||
      photos.some(
        (photo, index) => photo.id !== book?.photographs?.[index]?.id,
      ));

  const handleSaveOrder = async () => {
    if (!isOrderDirty) return;
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/book/${id}/photo/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographs: photos.map((p) => p.id) }),
      });
      if (res.ok) {
        toaster.create({
          title: "フォトの順番を保存しました",
          type: "success",
          closable: true,
        });
        await refreshBook();
      } else {
        const error = await res.text();
        toaster.create({
          title: "順番の保存に失敗しました",
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
      setSavingOrder(false);
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

      {photos.length > 0 ? (
        <div className="w-full max-w-3xl">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              矢印ボタンで順番を入れ替え、削除や編集ができます。
            </p>
            <Button
              size="sm"
              colorPalette="blue"
              disabled={!isOrderDirty}
              loading={savingOrder}
              onClick={handleSaveOrder}
            >
              順番を保存
            </Button>
          </div>
          {isOrderDirty && (
            <p className="mb-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              順番が変更されています。「順番を保存」を押すと反映されます。
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
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
                    {index + 1}. {photo.title ?? "無題"}
                  </p>
                </div>
                <div className="absolute right-1 top-1 flex flex-col gap-1">
                  <Button
                    size="xs"
                    variant="surface"
                    aria-label="前へ"
                    disabled={index === 0}
                    onClick={() => movePhoto(index, -1)}
                  >
                    <HiArrowUp />
                  </Button>
                  <Button
                    size="xs"
                    variant="surface"
                    aria-label="次へ"
                    disabled={index === photos.length - 1}
                    onClick={() => movePhoto(index, 1)}
                  >
                    <HiArrowDown />
                  </Button>
                </div>
                <div className="absolute left-1 top-1 flex gap-1">
                  {photo.isOwner && (
                    <Button
                      asChild
                      size="xs"
                      variant="surface"
                      aria-label="編集"
                    >
                      <Link href={`/photo/edit/${photo.id}`}>
                        <HiPencil />
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="xs"
                    colorPalette="red"
                    aria-label="削除"
                    loading={deletingPhotoId === photo.id}
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    削除
                  </Button>
                </div>
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

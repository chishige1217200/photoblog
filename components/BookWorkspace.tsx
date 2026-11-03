"use client";

import { Book } from "@/types/PhotoBlog/book";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiBookOpen,
  HiCamera,
  HiCog,
  HiTrash,
} from "react-icons/hi";
import {
  Badge,
  Button,
  Dialog,
  HStack,
  Skeleton,
  Tabs,
} from "@chakra-ui/react";
import { toaster } from "./ui/toaster";
import BookEditor from "./BookEditor";
import BookPhotoManager from "./BookPhotoManager";

type Props = {
  id: string;
  /** 開くタブ。deep link（?tab=photos）から指定する */
  initialTab?: "info" | "photos";
  /** 開いたときにフォト追加ダイアログも開く（?add=1） */
  initialAddOpen?: boolean;
};

/**
 * ブック編集・フォト追加・フォト並び替え/削除を統合した画面。
 * ヘッダーにブック情報と操作をまとめ、タブで「ブック情報」と「フォト」を切り替える。
 */
export default function BookWorkspace({
  id,
  initialTab = "info",
  initialAddOpen = false,
}: Props) {
  const [book, setBook] = useState<Book | null>(null);
  const [state, setState] = useState<"loading" | "error" | "forbidden" | "ok">(
    "loading",
  );
  const [deletingBook, setDeletingBook] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const applyBook = (data: Book) => {
    if (!data.isOwner && !data.isCollaborator) {
      setState("forbidden");
      return;
    }
    setBook(data);
    setState("ok");
  };

  // ブックの再取得（保存・フォト操作後に呼ぶ）
  const refreshBook = async () => {
    const res = await fetch(`/api/book/search/${id}`);
    if (!res.ok) {
      setState("error");
      return;
    }
    applyBook((await res.json()) as Book);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/book/search/${id}`);
        if (!res.ok) {
          if (!cancelled) setState("error");
          return;
        }
        const data = (await res.json()) as Book;
        if (!cancelled) applyBook(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDeleteBook = async () => {
    setDeletingBook(true);
    try {
      const res = await fetch(`/api/book/${id}`, { method: "DELETE" });
      if (res.ok) {
        toaster.create({
          title: "ブックを削除しました",
          type: "success",
          closable: true,
        });
        window.location.href = "/book";
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

  if (state === "error" || state === "forbidden") {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-lg">
          {state === "error"
            ? "このブックを編集できません。"
            : "このブックを編集する権限がありません。"}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/book">ブック一覧へ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8">
      <header className="flex flex-wrap items-center gap-4 border-b border-zinc-200 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          {book?.thumbnail?.url ? (
            <Image
              src={book.thumbnail.url}
              alt={book.title ?? ""}
              width={72}
              height={96}
              className="h-24 w-18 rounded-md object-cover"
            />
          ) : (
            <Skeleton h="24" w="18" borderRadius="md" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {book ? (book.title ?? "無題") : "読み込み中..."}
              </h1>
              {book && (
                <Badge
                  colorPalette={book.isPrivate ? "purple" : "green"}
                  variant="subtle"
                  size="sm"
                >
                  {book.isPrivate ? "限定公開" : "全体公開"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {book?.subTitle || book?.author
                ? [book?.subTitle, book?.author].filter(Boolean).join(" / ")
                : "サブタイトル・著者は未設定"}
            </p>
            <p className="text-xs text-zinc-500">
              フォト {book?.photographs?.length ?? 0}枚
            </p>
          </div>
        </div>

        <HStack gap="2" ms="auto" wrap="wrap">
          <Button asChild size="sm" variant="outline">
            <Link href="/book">ブック一覧</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/book/${id}`}>
              <HiBookOpen /> 閲覧する
            </Link>
          </Button>
          {book?.isOwner && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              onClick={() => setDeleteOpen(true)}
            >
              <HiTrash /> ブックを削除
            </Button>
          )}
        </HStack>
      </header>

      {state === "loading" ? (
        <Skeleton h="64" mt="6" borderRadius="xl" />
      ) : (
        <Tabs.Root
          defaultValue={initialTab}
          variant="line"
          mt="4"
          lazyMount
          onValueChange={(e) => {
            // タブをURLへ反映して、同じ位置から共有・再表示できるようにする
            const next =
              e.value === "photos" ? `/book/${id}/edit?tab=photos` : `/book/${id}/edit`;
            window.history.replaceState(null, "", next);
          }}
        >
          <Tabs.List>
            <Tabs.Trigger value="info">
              <HiCog /> ブック情報
            </Tabs.Trigger>
            <Tabs.Trigger value="photos">
              <HiCamera /> フォト（{book?.photographs?.length ?? 0}）
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="info" pt="4">
            {/* keyでブックIDが変わったときにフォームを再マウントする */}
            <BookEditor key={id} id={id} onSaved={refreshBook} />
          </Tabs.Content>

          <Tabs.Content value="photos" pt="4">
            {book && (
              <BookPhotoManager
                bookId={id}
                book={book}
                onBookChange={refreshBook}
                initialAddOpen={initialAddOpen}
              />
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}

      <Dialog.Root
        lazyMount
        placement="center"
        open={deleteOpen}
        onOpenChange={(e) => setDeleteOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>ブックを削除しますか？</Dialog.Title>
              <Dialog.Description>
                ブック内のフォトはフォト一覧に残ります。この操作は取り消せません。
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <HStack gap="2">
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm">
                    キャンセル
                  </Button>
                </Dialog.CloseTrigger>
                <Button
                  size="sm"
                  colorPalette="red"
                  loading={deletingBook}
                  onClick={handleDeleteBook}
                >
                  削除する
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}

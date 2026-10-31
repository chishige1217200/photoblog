"use client";

import { Book } from "@/types/PhotoBlog/book";
import { Photo } from "@/types/PhotoBlog/photo";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  HiArrowDown,
  HiArrowUp,
  HiMenuAlt4,
  HiPencil,
  HiPlus,
  HiSave,
  HiTrash,
} from "react-icons/hi";
import {
  Button,
  Dialog,
  Field,
  FileUpload,
  HStack,
  Input,
  SegmentGroupRoot,
  SegmentGroupItem,
  SegmentGroupItemHiddenInput,
  SegmentGroupItemText,
  SegmentGroupIndicator,
  Skeleton,
  Span,
  Text,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "./ui/toaster";
import PhotoForm from "./PhotoForm";

type AddMode = "upload" | "existing";

type Props = {
  bookId: string;
  book: Book;
  /** 並び替え・追加・削除など、ブック側の更新後に呼ばれる */
  onBookChange: () => void;
  /** 開いた直後にフォト追加ダイアログを開く */
  initialAddOpen?: boolean;
};

/**
 * ブックのフォトを並び替え・追加・編集・削除するセクション。
 * 従来の「フォト追加」「フォト並び替え/削除」画面を1つの画面に統合したもの。
 */
export default function BookPhotoManager({
  bookId,
  book,
  onBookChange,
  initialAddOpen = false,
}: Props) {
  const [photos, setPhotos] = useState<Photo[]>(book.photographs ?? []);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [addOpen, setAddOpen] = useState(initialAddOpen);
  const dragIndexRef = useRef<number | null>(null);

  // ブックの再取得時は、未保存の並び替えを維持したまま追加・削除だけを反映する
  useEffect(() => {
    const incoming = book.photographs ?? [];
    setPhotos((prev) => {
      if (prev.length === 0) return incoming;
      const byId = new Map(incoming.map((photo) => [photo.id, photo]));
      const kept = prev
        .map((photo) => byId.get(photo.id))
        .filter((photo): photo is Photo => Boolean(photo));
      const keptIds = new Set(kept.map((photo) => photo.id));
      const added = incoming.filter((photo) => !keptIds.has(photo.id));
      return [...kept, ...added];
    });
  }, [book.photographs]);

  const isOrderDirty =
    photos.length > 0 &&
    (photos.length !== (book.photographs?.length ?? 0) ||
      photos.some(
        (photo, index) => photo.id !== book.photographs?.[index]?.id,
      ));

  const movePhoto = (index: number, direction: -1 | 1) => {
    setPhotos((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const dropPhoto = (from: number, to: number) => {
    if (from === to) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleSaveOrder = async () => {
    if (!isOrderDirty) return;
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/book/${bookId}/photo/order`, {
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
        onBookChange();
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

  const handleRemovePhoto = async (photoId: string) => {
    if (!window.confirm("このフォトをブックから削除しますか？\n（フォト自体はフォト一覧に残ります）")) {
      return;
    }
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/book/${bookId}/photo/${photoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toaster.create({
          title: "ブックからフォトを削除しました",
          type: "success",
          closable: true,
        });
        onBookChange();
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">
            フォト（{photos.length}枚）
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            カードをドラッグして並び替えできます。順番を変えたら「順番を保存」を押してください。
          </p>
        </div>
        <HStack gap="2" wrap="wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddOpen(true)}
          >
            <HiPlus /> フォトを追加
          </Button>
          <Button
            size="sm"
            colorPalette="blue"
            disabled={!isOrderDirty}
            loading={savingOrder}
            onClick={handleSaveOrder}
          >
            <HiSave /> 順番を保存
          </Button>
        </HStack>
      </div>

      {isOrderDirty && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          順番が変更されています。「順番を保存」を押すとブックへ反映されます。
        </p>
      )}

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            このブックにフォトは登録されていません。
          </p>
          <Button size="sm" mt="4" onClick={() => setAddOpen(true)}>
            <HiPlus /> 最初のフォトを追加する
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => {
                dragIndexRef.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = dragIndexRef.current;
                dragIndexRef.current = null;
                if (from === null) return;
                dropPhoto(from, index);
              }}
              className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
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

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1">
                <p className="truncate text-xs text-white">
                  {index + 1}. {photo.title ?? "無題"}
                </p>
                <Span
                  as="span"
                  cursor="grab"
                  color="white"
                  aria-label="ドラッグで並び替え"
                  title="ドラッグで並び替え"
                >
                  <HiMenuAlt4 />
                </Span>
              </div>

              <div className="absolute right-1 top-1 flex flex-col gap-1">
                <Button
                  size="xs"
                  variant="surface"
                  aria-label="前へ"
                  title="前へ"
                  disabled={index === 0}
                  onClick={() => movePhoto(index, -1)}
                >
                  <HiArrowUp />
                </Button>
                <Button
                  size="xs"
                  variant="surface"
                  aria-label="次へ"
                  title="次へ"
                  disabled={index === photos.length - 1}
                  onClick={() => movePhoto(index, 1)}
                >
                  <HiArrowDown />
                </Button>
              </div>

              <div className="absolute left-1 top-1 flex gap-1">
                {photo.isOwner && (
                  <Button
                    size="xs"
                    variant="surface"
                    aria-label="編集"
                    title="編集"
                    onClick={() => setEditingPhoto(photo)}
                  >
                    <HiPencil />
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="surface"
                  colorPalette="red"
                  aria-label="ブックから削除"
                  title="ブックから削除"
                  loading={deletingPhotoId === photo.id}
                  onClick={() => handleRemovePhoto(photo.id)}
                >
                  <HiTrash />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddPhotoDialog
        bookId={bookId}
        open={addOpen}
        onOpenChange={setAddOpen}
        existingPhotoIds={(book.photographs ?? []).map((photo) => photo.id)}
        onAdded={onBookChange}
      />

      <Dialog.Root
        lazyMount
        placement="top"
        open={editingPhoto !== null}
        onOpenChange={(e) => {
          if (!e.open) setEditingPhoto(null);
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg">
            <Dialog.Header>
              <Dialog.Title>フォトを編集</Dialog.Title>
              <Dialog.Description>
                このブックに表示するフォトの情報を変更します。
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              {editingPhoto && (
                <PhotoForm
                  key={editingPhoto.id}
                  photoId={editingPhoto.id}
                  initialTitle={editingPhoto.title ?? ""}
                  initialCaption={editingPhoto.caption ?? ""}
                  initialShotAt={editingPhoto.shotAt?.slice(0, 10) ?? ""}
                  initialImageUrl={editingPhoto.photograph?.url}
                  onSuccess={() => {
                    setEditingPhoto(null);
                    onBookChange();
                  }}
                />
              )}
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <Button variant="ghost" size="sm">
                閉じる
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </div>
  );
}

/**
 * フォト追加ダイアログ。
 * 新規アップロードと既存フォトからの追加を同じフォームで切り替える。
 */
function AddPhotoDialog({
  bookId,
  open,
  onOpenChange,
  existingPhotoIds,
  onAdded,
}: {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPhotoIds: string[];
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<AddMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [shotAt, setShotAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || mode !== "existing" || photos.length > 0) return;
    const fetchPhotos = async () => {
      setPhotosLoading(true);
      try {
        const res = await fetch("/api/photo/search?limit=100");
        if (res.ok) {
          const data = (await res.json()) as { contents: Photo[] };
          setPhotos(data.contents);
        } else {
          toaster.create({
            title: "フォトの取得に失敗しました",
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
        setPhotosLoading(false);
      }
    };
    fetchPhotos();
  }, [open, mode, photos.length]);

  // ブックに既に登録済みのフォトは選択対象から除外する
  const selectablePhotos = photos.filter(
    (photo) => !existingPhotoIds.includes(photo.id),
  );

  const reset = () => {
    setFile(null);
    setPreviewImage(null);
    setTitle("");
    setCaption("");
    setShotAt("");
    setSelectedPhotoId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "upload" && !file) {
      toaster.create({
        title: "エラー",
        description: "フォトを選択してください。",
        type: "error",
        closable: true,
      });
      return;
    }
    if (mode === "existing" && !selectedPhotoId) {
      toaster.create({
        title: "エラー",
        description: "追加するフォトを選択してください。",
        type: "error",
        closable: true,
      });
      return;
    }

    const formData = new FormData();
    if (mode === "upload") {
      formData.append("file", file!);
      if (title) formData.append("title", title);
      if (caption) formData.append("caption", caption);
      if (shotAt) formData.append("shotAt", shotAt);
    } else {
      formData.append("photoId", selectedPhotoId!);
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/book/${bookId}/photo`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toaster.create({
          title: "フォトを追加しました",
          type: "success",
          closable: true,
        });
        reset();
        onAdded();
      } else {
        const error = await res.text();
        toaster.create({
          title: "追加に失敗しました",
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
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      lazyMount
      placement="top"
      open={open}
      onOpenChange={(e) => {
        onOpenChange(e.open);
        if (!e.open) reset();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="2xl">
          <Dialog.Header>
            <Dialog.Title>ブックにフォトを追加</Dialog.Title>
            <Dialog.Description>
              新しいフォトをアップロードするか、既存のフォトをブックへ追加します。
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <form onSubmit={handleSubmit}>
              <VStack gap="6" width="full" css={{ "--field-label-width": "96px" }}>
                <Field.Root orientation="horizontal">
                  <Field.Label>追加方法</Field.Label>
                  <SegmentGroupRoot
                    value={mode}
                    onValueChange={(e) => setMode(e.value as AddMode)}
                    flex="1"
                  >
                    <SegmentGroupItem value="upload">
                      <SegmentGroupItemText>新規アップロード</SegmentGroupItemText>
                      <SegmentGroupItemHiddenInput />
                    </SegmentGroupItem>
                    <SegmentGroupItem value="existing">
                      <SegmentGroupItemText>既存フォトから追加</SegmentGroupItemText>
                      <SegmentGroupItemHiddenInput />
                    </SegmentGroupItem>
                    <SegmentGroupIndicator />
                  </SegmentGroupRoot>
                </Field.Root>

                {mode === "upload" && (
                  <>
                    <Field.Root>
                      <FileUpload.Root
                        accept={["image/*"]}
                        onFileChange={(e) => {
                          const files = e.acceptedFiles;
                          if (files && files.length > 0) {
                            setFile(files[0]);
                            setPreviewImage(URL.createObjectURL(files[0]));
                          }
                        }}
                      >
                        <Field.Label>フォト</Field.Label>
                        <FileUpload.HiddenInput />
                        <FileUpload.Trigger asChild>
                          <Button variant="outline" size="sm">
                            フォトを選択する
                          </Button>
                        </FileUpload.Trigger>
                        <Field.HelperText>フォトプレビュー</Field.HelperText>
                        {previewImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="w-full rounded-md"
                          />
                        ) : (
                          <Skeleton className="w-full aspect-4/3" />
                        )}
                      </FileUpload.Root>
                    </Field.Root>

                    <Field.Root orientation="horizontal">
                      <Field.Label>タイトル</Field.Label>
                      <Input
                        placeholder="タイトルを入力してください。"
                        flex="1"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root orientation="horizontal">
                      <Field.Label>キャプション</Field.Label>
                      <Input
                        placeholder="キャプションを入力してください。"
                        flex="1"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                      />
                    </Field.Root>

                    <Field.Root orientation="horizontal">
                      <Field.Label>撮影日</Field.Label>
                      <Input
                        type="date"
                        flex="1"
                        value={shotAt}
                        onChange={(e) => setShotAt(e.target.value)}
                      />
                    </Field.Root>
                  </>
                )}

                {mode === "existing" && (
                  <Field.Root>
                    <Field.Label>フォト</Field.Label>
                    <Field.HelperText>
                      追加したいフォトを選択してください。
                    </Field.HelperText>
                    {photosLoading ? (
                      <Skeleton className="w-full h-40" />
                    ) : selectablePhotos.length > 0 ? (
                      <div className="grid max-h-80 w-full grid-cols-3 gap-2 overflow-y-auto">
                        {selectablePhotos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setSelectedPhotoId(photo.id)}
                            className={`overflow-hidden rounded-lg border-2 ${
                              selectedPhotoId === photo.id
                                ? "border-blue-500"
                                : "border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.photograph?.url ?? ""}
                              alt={photo.title ?? ""}
                              className="aspect-square w-full object-cover"
                            />
                            <span className="block truncate bg-black/50 px-1 py-0.5 text-xs text-white">
                              {photo.title ?? "無題"}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Text textStyle="sm" color="fg.muted">
                        追加できるフォトがありません。
                      </Text>
                    )}
                  </Field.Root>
                )}

                <HStack justify="flex-end" gap="2" pt="2">
                  <Dialog.CloseTrigger asChild>
                    <Button variant="ghost" type="button">
                      キャンセル
                    </Button>
                  </Dialog.CloseTrigger>
                  <Button type="submit" loading={loading} colorPalette="blue">
                    <HiPlus /> フォトを追加
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

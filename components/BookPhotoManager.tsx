"use client";

import { Book } from "@/types/PhotoBlog/book";
import { Photo } from "@/types/PhotoBlog/photo";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  HiArrowDown,
  HiArrowUp,
  HiCheck,
  HiMenuAlt4,
  HiPencil,
  HiPlus,
  HiSave,
  HiTrash,
} from "react-icons/hi";
import { LuX } from "react-icons/lu";
import {
  Box,
  Button,
  Dialog,
  Field,
  FileUpload,
  HStack,
  Progress,
  SegmentGroupRoot,
  SegmentGroupItem,
  SegmentGroupItemHiddenInput,
  SegmentGroupItemText,
  SegmentGroupIndicator,
  Skeleton,
  Span,
  Text,
  useFileUpload,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "./ui/toaster";
import PhotoForm from "./PhotoForm";
import { cmsSquareThumbUrl } from "@/lib/microcmsImage";

// 並び替えグリッドは 2〜5 列（1セルあたり最大で約 215px 四方）。
// 2 倍 DPR まで考慮した正方形サムネイルを CDN 側に生成させる。
const GRID_THUMB_SIZE = 400;

// フォト選択ピッカーは minmax(9rem, 1fr) のグリッド（1セルあたり約 150〜200px）。
const PICKER_THUMB_SIZE = 320;

// 一括アップロードで 1 回のダイアログ操作から追加できる最大枚数
const MAX_UPLOAD_FILES = 50;

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
                  src={cmsSquareThumbUrl(
                    photo.photograph.url,
                    GRID_THUMB_SIZE,
                  )}
                  alt={photo.title ?? ""}
                  width={GRID_THUMB_SIZE}
                  height={GRID_THUMB_SIZE}
                  className="aspect-square w-full object-cover"
                  unoptimized
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
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
    new Set(),
  );

  // 複数選択を有効化し、選択・削除・クリアのいずれでも files 状態へ同期する
  const fileUpload = useFileUpload({
    accept: ["image/*"],
    maxFiles: MAX_UPLOAD_FILES,
    onFileChange(details) {
      setFiles(details.acceptedFiles);
    },
    onFileReject(details) {
      if (details.files.length === 0) return;
      const reason = details.files[0].errors[0];
      toaster.create({
        title:
          reason === "FILE_INVALID_TYPE"
            ? "画像ファイルのみ選択できます"
            : `一度に追加できるのは ${MAX_UPLOAD_FILES} 枚までです`,
        type: "error",
        closable: true,
      });
    },
  });

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
    fileUpload.clearFiles();
    setFiles([]);
    setSelectedPhotoIds(new Set());
    setProgress({ done: 0, total: 0, failed: 0 });
  };

  // ファイル名（拡張子を除く部分）をタイトルとして使う
  const deriveTitle = (filename: string) =>
    filename.replace(/\.[^.]+$/, "").trim();

  const togglePhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targets =
      mode === "upload"
        ? files.map((file) => ({
            label: file.name,
            formData: () => {
              const formData = new FormData();
              formData.append("file", file);
              const derived = deriveTitle(file.name);
              if (derived) formData.append("title", derived);
              return formData;
            },
          }))
        : Array.from(selectedPhotoIds).map((photoId) => ({
            label: photoId,
            formData: () => {
              const formData = new FormData();
              formData.append("photoId", photoId);
              return formData;
            },
          }));

    if (targets.length === 0) {
      toaster.create({
        title: "エラー",
        description:
          mode === "upload"
            ? "フォトを選択してください。"
            : "追加するフォトを選択してください。",
        type: "error",
        closable: true,
      });
      return;
    }

    // 1 枚ずつ既存 API へ順に送信する（サーバー側の一括対応は不要）
    setLoading(true);
    setProgress({ done: 0, total: targets.length, failed: 0 });
    let failed = 0;
    const failedLabels: string[] = [];
    for (let i = 0; i < targets.length; i += 1) {
      try {
        const res = await fetch(`/api/book/${bookId}/photo`, {
          method: "POST",
          body: targets[i].formData(),
        });
        if (!res.ok) {
          failed += 1;
          failedLabels.push(targets[i].label);
        }
      } catch (err) {
        console.error(err);
        failed += 1;
        failedLabels.push(targets[i].label);
      }
      setProgress({ done: i + 1, total: targets.length, failed });
    }

    const succeeded = targets.length - failed;
    if (failed === 0) {
      toaster.create({
        title: `${succeeded} 枚のフォトを追加しました`,
        type: "success",
        closable: true,
      });
    } else if (succeeded > 0) {
      toaster.create({
        title: `${succeeded} 枚追加し、${failed} 枚追加できませんでした`,
        description: failedLabels.slice(0, 3).join("、"),
        type: "warning",
        closable: true,
      });
    } else {
      toaster.create({
        title: "フォトを追加できませんでした",
        description: failedLabels.slice(0, 3).join("、"),
        type: "error",
        closable: true,
      });
    }

    setLoading(false);
    reset();
    onAdded();
  };

  return (
    <Dialog.Root
      lazyMount
      placement="top"
      open={open}
      onOpenChange={(e) => {
        // アップロード中は誤って閉じられないようにする
        if (loading && !e.open) return;
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
                  <Field.Root>
                    <Field.Label>フォト</Field.Label>
                    <FileUpload.RootProvider value={fileUpload}>
                      <FileUpload.HiddenInput />
                      <Field.HelperText>
                        ドラッグ＆ドロップまたはクリックで複数選択できます（最大{" "}
                        {MAX_UPLOAD_FILES} 枚）。タイトルはファイル名から付けられます。
                      </Field.HelperText>
                      <FileUpload.Dropzone
                        css={{
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          p: 6,
                        }}
                      >
                        <FileUpload.DropzoneContent>
                          <Box fontSize="sm" color="fg.muted">
                            ここにフォトをドラッグ＆ドロップ、
                            <br />
                            またはクリックしてファイルを選択
                          </Box>
                        </FileUpload.DropzoneContent>
                      </FileUpload.Dropzone>

                      <FileUpload.ItemGroup
                        css={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))",
                          gap: "0.75rem",
                          pt: 4,
                        }}
                      >
                        {files.map((file) => (
                          <FileUpload.Item
                            key={file.name}
                            file={file}
                            css={{
                              flexDirection: "column",
                              alignItems: "stretch",
                              gap: "0.25rem",
                              p: 2,
                            }}
                          >
                            <Box
                              position="relative"
                              borderRadius="md"
                              overflow="hidden"
                              bg="bg.muted"
                            >
                              <FileUpload.ItemPreviewImage
                                css={{
                                  width: "100%",
                                  aspectRatio: "4 / 3",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                              <FileUpload.ItemDeleteTrigger
                                asChild
                                position="absolute"
                                top="0.25rem"
                                right="0.25rem"
                              >
                                <Button
                                  variant="solid"
                                  colorPalette="red"
                                  size="2xs"
                                  aria-label={`${file.name} を削除`}
                                >
                                  <LuX size={12} />
                                </Button>
                              </FileUpload.ItemDeleteTrigger>
                            </Box>
                            <FileUpload.ItemName
                              css={{
                                fontSize: "0.75rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            />
                          </FileUpload.Item>
                        ))}
                      </FileUpload.ItemGroup>
                    </FileUpload.RootProvider>
                  </Field.Root>
                )}

                {mode === "existing" && (
                  <Field.Root>
                    <Field.Label>フォト</Field.Label>
                    <Field.HelperText>
                      追加したいフォトを複数選択できます
                      {selectedPhotoIds.size > 0
                        ? `（${selectedPhotoIds.size} 枚選択中）`
                        : ""}
                      。
                    </Field.HelperText>
                    {photosLoading ? (
                      <Skeleton className="w-full h-40" />
                    ) : selectablePhotos.length > 0 ? (
                      <div className="grid max-h-80 w-full auto-rows-max grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2 overflow-y-auto">
                        {selectablePhotos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => togglePhoto(photo.id)}
                            className={`relative overflow-hidden rounded-lg border-2 ${
                              selectedPhotoIds.has(photo.id)
                                ? "border-blue-500"
                                : "border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cmsSquareThumbUrl(
                                photo.photograph?.url ?? "",
                                PICKER_THUMB_SIZE,
                              )}
                              alt={photo.title ?? ""}
                              className="aspect-square w-full object-cover"
                            />
                            {selectedPhotoIds.has(photo.id) && (
                              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                                <HiCheck size={12} />
                              </span>
                            )}
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
                  {loading && (
                    <HStack gap="3" flex="1" justify="flex-end">
                      <Progress.Root
                        value={progress.done}
                        max={progress.total}
                        size="sm"
                        width="40"
                      >
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                        <Progress.ValueText>
                          {progress.done}/{progress.total} 枚
                          {progress.failed > 0 ? `（失敗 ${progress.failed}）` : ""}
                        </Progress.ValueText>
                      </Progress.Root>
                    </HStack>
                  )}
                  <Dialog.CloseTrigger asChild>
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={loading}
                    >
                      キャンセル
                    </Button>
                  </Dialog.CloseTrigger>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    colorPalette="blue"
                  >
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

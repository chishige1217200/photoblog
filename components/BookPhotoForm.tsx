"use client";

import {
  VStack,
  Input,
  Button,
  Field,
  FileUpload,
  Skeleton,
  HStack,
  SegmentGroupRoot,
  SegmentGroupItem,
  SegmentGroupItemText,
  SegmentGroupItemHiddenInput,
  SegmentGroupIndicator,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { HiUpload } from "react-icons/hi";
import { Photo } from "@/types/PhotoBlog/photo";
import { toaster } from "./ui/toaster";
import { Lens } from "./ui/lens";

type AddMode = "upload" | "existing";

type Props = {
  bookId: string;
  existingPhotoIds: string[];
  onUploaded: () => void;
};

export default function BookPhotoForm({
  bookId,
  existingPhotoIds,
  onUploaded,
}: Props) {
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

  // 既存フォトから追加モードになったら、自分のフォトを取得する
  useEffect(() => {
    if (mode !== "existing" || photos.length > 0) return;
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
  }, [mode, photos.length]);

  // ブックに既に登録済みのフォトは選択対象から除外する
  const selectablePhotos = photos.filter(
    (photo) => !existingPhotoIds.includes(photo.id),
  );

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
        // フォームをリセット
        setFile(null);
        setPreviewImage(null);
        setTitle("");
        setCaption("");
        setShotAt("");
        setSelectedPhotoId(null);
        onUploaded();
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
    <form onSubmit={handleSubmit}>
      <VStack
        gap="8"
        maxW="md"
        width={500}
        css={{ "--field-label-width": "96px" }}
        style={{ padding: 20 }}
      >
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
                  <HiUpload /> フォトを選択する
                </Button>
              </FileUpload.Trigger>
              <Field.HelperText>フォトプレビュー</Field.HelperText>
              {previewImage ? (
                <Lens
                  zoomFactor={2}
                  lensSize={150}
                  isStatic={false}
                  ariaLabel="Zoom Area"
                >
                  <img src={previewImage} alt="Preview" />
                </Lens>
              ) : (
                <Skeleton className="w-full aspect-4/3" />
              )}
            </FileUpload.Root>
          </Field.Root>
        )}

        {mode === "upload" && (
          <>
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
              <div className="grid w-full grid-cols-3 gap-2">
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
                    {photo.photograph?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.photograph.url}
                        alt={photo.title ?? ""}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-zinc-100 text-2xl dark:bg-zinc-800">
                        ?
                      </div>
                    )}
                    <span className="block truncate bg-black/50 px-1 py-0.5 text-xs text-white">
                      {photo.title ?? "無題"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                追加できるフォトがありません。
              </p>
            )}
          </Field.Root>
        )}

        <HStack justify="center" mt="4">
          <Button type="submit" loading={loading}>
            フォトを追加
          </Button>
        </HStack>
      </VStack>
    </form>
  );
}

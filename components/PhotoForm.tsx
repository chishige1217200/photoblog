"use client";

import {
  VStack,
  Input,
  Button,
  Field,
  FileUpload,
  Skeleton,
  HStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { HiUpload } from "react-icons/hi";
import { toaster } from "./ui/toaster";
import { Lens } from "./ui/lens";

type Props = {
  /** 編集対象のフォトID。未指定の場合は作成用のフォームとして振る舞う */
  photoId?: string;
  initialTitle?: string;
  initialCaption?: string;
  /** YYYY-MM-DD 形式 */
  initialShotAt?: string;
  initialImageUrl?: string;
  submitLabel?: string;
  /** 送信成功時に呼ばれる。ページ遷移ではなく画面内へ組み込む際に使用 */
  onSuccess?: () => void;
};

/**
 * フォトの属性（画像・タイトル・キャプション・撮影日）を編集するフォーム。
 * フォト編集ページとブック編集画面のダイアログで共通利用する。
 */
export default function PhotoForm({
  photoId,
  initialTitle = "",
  initialCaption = "",
  initialShotAt = "",
  initialImageUrl,
  submitLabel = "更新する",
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(
    initialImageUrl ?? null,
  );
  const [title, setTitle] = useState(initialTitle);
  const [caption, setCaption] = useState(initialCaption);
  const [shotAt, setShotAt] = useState(initialShotAt);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    // 空欄でも明示的に送信し、クリアできるようにする
    formData.append("title", title);
    formData.append("caption", caption);
    formData.append("shotAt", shotAt);

    if (!photoId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/photo/${photoId}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        toaster.create({
          title: "更新に成功しました",
          type: "success",
          closable: true,
        });
        setFile(null);
        onSuccess?.();
      } else {
        const error = await res.text();
        toaster.create({
          title: "更新に失敗しました",
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
        gap="6"
        width="full"
        css={{ "--field-label-width": "96px" }}
      >
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
                <HiUpload /> フォトを変更する
              </Button>
            </FileUpload.Trigger>
            <Field.HelperText>
              変更しない場合は選択しないでください。
            </Field.HelperText>
            {previewImage ? (
              <Lens
                zoomFactor={2}
                lensSize={150}
                isStatic={false}
                ariaLabel="Zoom Area"
              >
                {/* blob URLのプレビューのためnext/imageは使えない */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImage} alt="Preview" />
              </Lens>
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

        <HStack justify="center" pt="2">
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </HStack>
      </VStack>
    </form>
  );
}

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
  bookId: string;
  onUploaded: () => void;
};

export default function BookPhotoForm({ bookId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [shotAt, setShotAt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toaster.create({
        title: "エラー",
        description: "フォトを選択してください。",
        type: "error",
        closable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    if (caption) formData.append("caption", caption);
    if (shotAt) formData.append("shotAt", shotAt);

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

        <HStack justify="center" mt="4">
          <Button type="submit" loading={loading}>
            フォトを追加
          </Button>
        </HStack>
      </VStack>
    </form>
  );
}

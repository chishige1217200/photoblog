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
import { useEffect, useState } from "react";
import { HiUpload } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { Photo } from "@/types/PhotoBlog/photo";
import { toaster } from "./ui/toaster";
import { Lens } from "./ui/lens";

type Props = {
  id: string;
};

export default function PhotoEditor({ id }: Props) {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [shotAt, setShotAt] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/photo/search/${photoId}`);
      if (!res.ok) {
        setHasError(true);
        return;
      }
      const data: Photo = await res.json();
      setTitle(data.title ?? "");
      setCaption(data.caption ?? "");
      // date入力欄はYYYY-MM-DD形式を要求するため、日付部分のみを抽出
      setShotAt(data.shotAt ? data.shotAt.slice(0, 10) : "");
      if (data.photograph?.url) {
        setPreviewImage(data.photograph.url);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
    }
  };

  useEffect(() => {
    loadPhoto(id);
  }, [id]);

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

    setLoading(true);
    try {
      const res = await fetch(`/api/photo/${id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        toaster.create({
          title: "更新に成功しました",
          type: "success",
          closable: true,
        });
        router.push("/photo");
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
    <>
      {hasError ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg">このフォトを編集できません。</p>
        </div>
      ) : (
        <div className="flex flex-col items-center p-4">
          <h1 className="mb-4 text-2xl font-bold">フォトを編集</h1>
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
                  更新する
                </Button>
              </HStack>
            </VStack>
          </form>
        </div>
      )}
    </>
  );
}

"use client";

import {
  VStack,
  Input,
  Button,
  Switch,
  Field,
  TagsInput,
  Text,
  FileUpload,
  Span,
  Skeleton,
  HStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { HiUpload } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { toaster } from "./ui/toaster";
import { Lens } from "./ui/lens";
import { CmsBook, convertToList } from "@/types/microCMS/book";

export type BookEditorProps = {
  id?: string;
};

export default function BookEditor({ id }: BookEditorProps) {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [viewers, setViewers] = useState<string[]>([]);
  const [editors, setEditors] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBook = async (bookId: string) => {
    try {
      const res = await fetch(`/api/book/search/raw/${bookId}`);
      if (!res.ok) {
        setHasError(true);
        return;
      }
      const data: CmsBook = await res.json();
      setTitle(data.title ?? "");
      setSubTitle(data.subTitle ?? "");
      setAuthor(data.author ?? "");
      setIsPrivate(data.isPrivate ?? true);
      setViewers(convertToList(data.allowUserIds));
      setEditors(convertToList(data.collaborateUserIds));
      if (data.thumbnail?.url) {
        setPreviewImage(data.thumbnail.url);
      }
    } catch (err) {
      console.error(err);
      setHasError(true);
    }
  };

  useEffect(() => {
    if (id) {
      loadBook(id);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      toaster.create({
        title: "エラー",
        description: "タイトルを入力してください。",
        type: "error",
        closable: true,
      });
      return;
    }
    if (!file && !id) {
      toaster.create({
        title: "エラー",
        description: "サムネイルのフォトを選択してください。",
        type: "error",
        closable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subTitle", subTitle);
    formData.append("author", author);
    formData.append("isPrivate", String(isPrivate));
    viewers.forEach((v) => formData.append("viewers", v));
    editors.forEach((v) => formData.append("editors", v));
    if (file) {
      formData.append("file", file);
    }

    const endpoint = id ? "/api/book/update" : "/api/book/create";
    if (id) {
      formData.append("id", id);
    }

    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        toaster.create({
          title: id ? "更新に成功しました" : "登録に成功しました",
          type: "success",
          closable: true,
        });
        if (id) {
          router.push(`/book/${id}`);
        } else {
          router.push(`/book/${data.id}`);
        }
      } else {
        const error = await res.text();
        toaster.create({
          title: "送信に失敗しました",
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
        <></>
      ) : (
        <form onSubmit={handleSubmit}>
          <HStack justify="center" align="top" gap="16" mt="8">
            <VStack
              gap="8"
              maxW="md"
              width={500}
              css={{ "--field-label-width": "96px" }}
              style={{ padding: 20 }}
            >
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
                <Field.Label>サブタイトル</Field.Label>
                <Input
                  placeholder="サブタイトルを入力してください。"
                  flex="1"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                />
              </Field.Root>

              <Field.Root orientation="horizontal">
                <Field.Label>著者</Field.Label>
                <Input
                  placeholder="著者を入力してください。"
                  flex="1"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </Field.Root>

              <Field.Root orientation="horizontal">
                <TagsInput.Root
                  value={editors}
                  onValueChange={(e) => setEditors(e.value)}
                >
                  <TagsInput.Label>共同編集対象ユーザID（メールアドレス）</TagsInput.Label>
                  <TagsInput.Control>
                    <TagsInput.Items />
                    <TagsInput.Input placeholder="共同編集者のメールアドレスを入力してください。" />
                  </TagsInput.Control>
                  <Span textStyle="xs" color="fg.muted" ms="auto">
                    <Text>
                      カンマ区切りで複数のメールアドレスを入力できます。
                    </Text>
                  </Span>
                </TagsInput.Root>
              </Field.Root>

              <Field.Root orientation="horizontal">
                <Field.Label>限定公開設定</Field.Label>
                <Switch.Root
                  checked={isPrivate}
                  onCheckedChange={(e) => setIsPrivate(e.checked)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Field.Root>
              <Span textStyle="xs" color="fg.muted" ms="auto">
                <Text>有効にすると、共同編集者と限定公開者のみが閲覧可能になります。</Text>
              </Span>

              <Field.Root orientation="horizontal">
                <TagsInput.Root
                  value={viewers}
                  onValueChange={(e) => setViewers(e.value)}
                >
                  <TagsInput.Label>限定公開対象ユーザID（メールアドレス）</TagsInput.Label>
                  <TagsInput.Control>
                    <TagsInput.Items />
                    <TagsInput.Input placeholder="限定公開者のメールアドレスを入力してください。" />
                  </TagsInput.Control>
                  <Span textStyle="xs" color="fg.muted" ms="auto">
                    <Text>
                      カンマ区切りで複数のメールアドレスを入力できます。
                    </Text>
                  </Span>
                  <Span textStyle="xs" color="fg.muted" ms="auto">
                    <Text>
                      限定公開設定が無効のときは、この設定は無視されます。
                    </Text>
                  </Span>
                </TagsInput.Root>
              </Field.Root>
            </VStack>
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
                  <Field.Label>
                    ブックのサムネイル
                    <Field.RequiredIndicator />
                  </Field.Label>
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
            </VStack>
          </HStack>
          <HStack justify="center" align="top" gap="16" mt="8">
            <VStack
              gap="8"
              maxW="md"
              width={500}
              css={{ "--field-label-width": "96px" }}
              style={{ padding: 20 }}
            >
              <Button colorScheme="blue" type="submit" loading={loading}>
                {id ? "更新" : "登録"}
              </Button>
            </VStack>
          </HStack>
        </form>
      )}
    </>
  );
}

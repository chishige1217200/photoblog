"use client";

import {
  VStack,
  Input,
  Textarea,
  Button,
  Switch,
  Field,
  TagsInput,
  FileUpload,
  Span,
  Skeleton,
  Text,
  HStack,
  ActionBar,
  Dialog,
  Portal,
  QrCode,
  Clipboard,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { HiUpload } from "react-icons/hi";
import {
  LuCircleArrowLeft,
  LuImages,
  LuNotebookPen,
  LuShare,
  LuShare2,
} from "react-icons/lu";
import { Toaster, toaster } from "../ui/toaster";
import { Lens } from "../ui/lens";

export default function PhotoForm() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [viewers, setViewers] = useState<string[]>([]);
  const [editors, setEditors] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", title);
    formData.append("date", date);
    formData.append("description", description);
    formData.append("isPrivate", String(isPrivate));

    viewers.forEach((v) => formData.append("viewers[]", v));
    editors.forEach((v) => formData.append("editors[]", v));

    if (file) {
      formData.append("file", file);
    }

    console.log("Form Data:");
    for (const pair of formData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
    }

    toaster.create({
      description: "File saved successfully",
      type: "success",
      closable: true,
    });

    console.log("Form submitted");

    // try {
    //   const res = await fetch("/api/photos", {
    //     method: "POST",
    //     body: formData,
    //   });

    //   if (res.ok) {
    //     alert("送信に成功しました！");
    //   } else {
    //     alert("送信に失敗しました");
    //   }
    // } catch (err) {
    //   console.error(err);
    //   alert("エラーが発生しました");
    // }
  };

  return (
    <>
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
              <Field.Label>撮影時刻</Field.Label>
              <Input
                type="datetime-local"
                flex="1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field.Root>

            <Field.Root orientation="horizontal">
              <Field.Label>説明</Field.Label>
              <Textarea
                placeholder="説明を入力してください。"
                flex="1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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

            <Field.Root orientation="horizontal">
              <TagsInput.Root
                value={viewers}
                onValueChange={(e) => setViewers(e.value)}
              >
                <TagsInput.Label>限定公開閲覧可能ユーザID</TagsInput.Label>
                <Field.HelperText>
                  限定公開閲覧可能なユーザのメールアドレス
                </Field.HelperText>
                <TagsInput.Control>
                  <TagsInput.Items />
                  <TagsInput.Input placeholder="Add mailaddress..." />
                </TagsInput.Control>
                <Span textStyle="xs" color="fg.muted" ms="auto">
                  {" "}
                  Press Enter or Return to add mailAddress{" "}
                </Span>
              </TagsInput.Root>
            </Field.Root>

            <Field.Root orientation="horizontal">
              <TagsInput.Root
                value={editors}
                onValueChange={(e) => setEditors(e.value)}
              >
                <TagsInput.Label>共同編集可能ユーザID</TagsInput.Label>
                <Field.HelperText>
                  共同編集可能なユーザのメールアドレス
                </Field.HelperText>
                <TagsInput.Control>
                  <TagsInput.Items />
                  <TagsInput.Input placeholder="Add mailaddress..." />
                </TagsInput.Control>
                <Span textStyle="xs" color="fg.muted" ms="auto">
                  {" "}
                  Press Enter or Return to add mailAddress{" "}
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
            <Field.Root required>
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
                  フォトアップロード
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
            <Button colorScheme="blue" type="submit">
              送信
            </Button>
            <Text fontSize="sm" color="fg.muted">
              © 2024 Your Company. All rights reserved.
            </Text>
          </VStack>
        </HStack>
      </form>

      <ActionBar.Root open={true}>
        <ActionBar.Positioner>
          <ActionBar.Content>
            <Dialog.Root placement="center">
              <Dialog.Trigger asChild>
                <Button variant="outline" size="sm">
                  <LuCircleArrowLeft />
                  ブック一覧
                </Button>
              </Dialog.Trigger>
              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title>確認</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Dialog.Description>
                        操作中の画面から離れます。よろしいですか？
                      </Dialog.Description>
                    </Dialog.Body>
                    <Dialog.Footer>
                      <Button variant="outline">いいえ</Button>
                      <Button colorPalette="red">はい</Button>
                    </Dialog.Footer>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>
            <Dialog.Root placement="center">
              <Dialog.Trigger asChild>
                <Button variant="outline" size="sm">
                  <LuShare2 />
                  共有
                </Button>
              </Dialog.Trigger>
              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title>リンク</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                      <div className="flex items-center gap-2">
                        <Text>{url}</Text>
                        <Clipboard.Root value={url || ""}>
                          <Clipboard.Trigger asChild>
                            <Button variant="surface" size="sm">
                              <Clipboard.Indicator />
                            </Button>
                          </Clipboard.Trigger>
                        </Clipboard.Root>
                      </div>
                      <QrCode.Root value={url || ""} size="2xl">
                        <QrCode.Frame>
                          <QrCode.Pattern />
                        </QrCode.Frame>
                      </QrCode.Root>
                    </Dialog.Body>
                    <Dialog.Footer>
                      <Button variant="outline">閉じる</Button>
                    </Dialog.Footer>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>
            <ActionBar.Separator />
            <Button variant="outline" size="sm">
              <LuImages />
              フォト管理
            </Button>
            <Button variant="outline" size="sm">
              <LuNotebookPen />
              ブック設定
            </Button>
          </ActionBar.Content>
        </ActionBar.Positioner>
      </ActionBar.Root>
    </>
  );
}

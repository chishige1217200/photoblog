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
  SegmentGroupRoot,
  SegmentGroupItem,
  SegmentGroupItemHiddenInput,
  SegmentGroupItemText,
  SegmentGroupIndicator,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { HiUpload } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { toaster } from "./ui/toaster";
import { Lens } from "./ui/lens";
import { CmsBook, convertToList } from "@/types/microCMS/book";
import { Photo } from "@/types/PhotoBlog/photo";

type ThumbnailMode = "upload" | "existing";

export type BookEditorProps = {
  id?: string;
  /** 保存成功時に呼ばれる。ブック編集画面内へ組み込む際に使用 */
  onSaved?: (bookId: string) => void;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function BookEditor({ id, onSaved }: BookEditorProps) {
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
  // サムネイルの選択方法：新規アップロード or 既存フォトから選択
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailMode>("upload");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  // 編集対象ブックの元サムネイル（モード切り戻し時に戻す）
  const [originalThumbnail, setOriginalThumbnail] = useState<string | null>(
    null,
  );

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
        setOriginalThumbnail(data.thumbnail.url);
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

  // 既存フォト一覧を取得（「既存フォトから選択」へ切り替えた時に一度だけ呼ぶ）
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

  const selectThumbnailMode = (mode: ThumbnailMode) => {
    setThumbnailMode(mode);
    if (mode === "existing") {
      if (photos.length === 0) {
        fetchPhotos();
      }
    } else {
      // アップロードへ戻す場合、未確定の既存フォト選択は取り消して元サムネイルへ戻す
      setFile(null);
      setSelectedPhotoId(null);
      setPreviewImage(originalThumbnail);
    }
  };

  const selectExistingPhoto = (photo: Photo) => {
    setSelectedPhotoId(photo.id);
    setFile(null);
    if (photo.photograph?.url) {
      setPreviewImage(photo.photograph.url);
    }
  };

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
    if (thumbnailMode === "upload") {
      if (!file && !id) {
        toaster.create({
          title: "エラー",
          description: "サムネイルのフォトを選択してください。",
          type: "error",
          closable: true,
        });
        return;
      }
    } else if (!selectedPhotoId) {
      toaster.create({
        title: "エラー",
        description: "サムネイルに使用する既存フォトを選択してください。",
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
    if (thumbnailMode === "existing") {
      formData.append("thumbnailPhotoId", selectedPhotoId!);
    } else if (file) {
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
        const bookId = id ?? data.id;
        if (onSaved) {
          onSaved(bookId);
        } else {
          router.push(`/book/${bookId}`);
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

  if (hasError) {
    return (
      <p className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
        このブックの情報を取得できませんでした。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Section title="基本情報">
            <VStack
              gap="4"
              width="full"
              align="stretch"
              css={{ "--field-label-width": "7rem" }}
            >
              <Field.Root orientation="horizontal">
                <Field.Label>
                  タイトル
                  <Field.RequiredIndicator />
                </Field.Label>
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
            </VStack>
          </Section>

          <Section
            title="公開設定"
            description="有効にすると、共同編集者と限定公開者のみが閲覧可能になります。"
          >
            <VStack
              gap="4"
              width="full"
              align="stretch"
              css={{ "--field-label-width": "7rem" }}
            >
              <Field.Root orientation="horizontal">
                <Field.Label>限定公開</Field.Label>
                <HStack gap="3">
                  <Switch.Root
                    checked={isPrivate}
                    onCheckedChange={(e) => setIsPrivate(e.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                  <Text textStyle="sm" color="fg.muted">
                    {isPrivate ? "限定公開" : "全体公開"}
                  </Text>
                </HStack>
              </Field.Root>

              <Field.Root>
                <TagsInput.Root
                  value={editors}
                  onValueChange={(e) => setEditors(e.value)}
                >
                  <TagsInput.Label>
                    共同編集対象ユーザID（メールアドレス）
                  </TagsInput.Label>
                  <TagsInput.Control>
                    <TagsInput.Items />
                    <TagsInput.Input placeholder="共同編集者のメールアドレスを入力してください。" />
                  </TagsInput.Control>
                  <Span textStyle="xs" color="fg.muted">
                    <Text>
                      Enterキーで追加できます。カンマ区切りでも入力できます。
                    </Text>
                  </Span>
                </TagsInput.Root>
              </Field.Root>

              <Field.Root>
                <TagsInput.Root
                  value={viewers}
                  onValueChange={(e) => setViewers(e.value)}
                  disabled={!isPrivate}
                >
                  <TagsInput.Label>
                    限定公開対象ユーザID（メールアドレス）
                  </TagsInput.Label>
                  <TagsInput.Control>
                    <TagsInput.Items />
                    <TagsInput.Input placeholder="限定公開者のメールアドレスを入力してください。" />
                  </TagsInput.Control>
                  <Span textStyle="xs" color="fg.muted">
                    <Text>
                      限定公開設定が無効のときは、この設定は無視されます。
                    </Text>
                  </Span>
                </TagsInput.Root>
              </Field.Root>
            </VStack>
          </Section>
        </div>

        <Section title="ブックのサムネイル" description="フォトプレビュー">
          <VStack gap="4" width="full" align="stretch">
            {/* 幅の狭いサムネイル欄では横並びにするとボタンがはみ出すため、
                ラベルを上に置き、セグメントを全幅で等分に広げる */}
            <Field.Root>
              <Field.Label>選択方法</Field.Label>
              <SegmentGroupRoot
                value={thumbnailMode}
                onValueChange={(e) => selectThumbnailMode(e.value as ThumbnailMode)}
                size="xs"
                width="full"
                minW="0"
              >
                <SegmentGroupItem value="upload" flex="1" minW="0" px="2">
                  <SegmentGroupItemText>新規アップロード</SegmentGroupItemText>
                  <SegmentGroupItemHiddenInput />
                </SegmentGroupItem>
                <SegmentGroupItem value="existing" flex="1" minW="0" px="2">
                  <SegmentGroupItemText>既存フォトから選択</SegmentGroupItemText>
                  <SegmentGroupItemHiddenInput />
                </SegmentGroupItem>
                <SegmentGroupIndicator />
              </SegmentGroupRoot>
            </Field.Root>

            {thumbnailMode === "upload" ? (
              <Field.Root>
                <FileUpload.Root
                  accept={["image/*"]}
                  onFileChange={(e) => {
                    const files = e.acceptedFiles;
                    if (files && files.length > 0) {
                      setFile(files[0]);
                      setSelectedPhotoId(null);
                      setPreviewImage(URL.createObjectURL(files[0]));
                    }
                  }}
                >
                  <FileUpload.HiddenInput />
                  <FileUpload.Trigger asChild>
                    <Button variant="outline" size="sm" width="full">
                      <HiUpload /> フォトを選択する
                    </Button>
                  </FileUpload.Trigger>
                  {previewImage ? (
                    <Lens
                      zoomFactor={2}
                      lensSize={150}
                      isStatic={false}
                      ariaLabel="Zoom Area"
                    >
                      {/* blob URLのプレビューのためnext/imageは使えない */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full rounded-md"
                      />
                    </Lens>
                  ) : (
                    <Skeleton className="w-full aspect-4/3" />
                  )}
                </FileUpload.Root>
              </Field.Root>
            ) : (
              <Field.Root>
                <Field.HelperText>
                  サムネイルに使用したいフォトを選択してください。
                </Field.HelperText>
                {photosLoading ? (
                  <Skeleton className="w-full h-40" />
                ) : photos.length > 0 ? (
                  <div className="grid max-h-80 w-full grid-cols-2 gap-2 overflow-y-auto">
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => selectExistingPhoto(photo)}
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
                    選択できるフォトがありません。
                  </Text>
                )}
              </Field.Root>
            )}
            {!id && (
              <Span textStyle="xs" color="fg.muted">
                <Text>サムネイルは必須です。</Text>
              </Span>
            )}
          </VStack>
        </Section>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          colorPalette="blue"
          type="submit"
          loading={loading}
          minW="10rem"
        >
          {id ? "変更を保存" : "ブックを作成"}
        </Button>
      </div>
    </form>
  );
}

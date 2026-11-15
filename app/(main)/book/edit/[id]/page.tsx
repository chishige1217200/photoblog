import BookWorkspace from "@/components/BookWorkspace";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; add?: string }>;
};

/**
 * ブック編集・フォト追加・フォト並び替え/削除を統合した画面。
 * ?tab=photos でフォトタブを開いた状態にする。
 */
export default async function EditBookPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab, add } = await searchParams;
  return (
    <BookWorkspace
      id={id}
      initialTab={tab === "photos" ? "photos" : "info"}
      initialAddOpen={add === "1"}
    />
  );
}

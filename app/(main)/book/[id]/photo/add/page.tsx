import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/** フォト追加画面はブック編集画面のフォトタブへ統合されたためリダイレクトする */
export default async function AddPhotoPage({ params }: Props) {
  const { id } = await params;
  redirect(`/book/${id}/edit?tab=photos&add=1`);
}

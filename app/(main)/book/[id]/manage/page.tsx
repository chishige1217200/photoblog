import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/** フォト並び替え/削除画面はブック編集画面へ統合されたためリダイレクトする */
export default async function ManageBookPage({ params }: Props) {
  const { id } = await params;
  redirect(`/book/${id}/edit?tab=photos`);
}

import BackLink from "@/components/BackLink";
import BookManage from "@/components/BookManage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ManageBookPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <BackLink href={`/book/${id}`} label="ブック詳細へ戻る" />
      <BookManage id={id} />
    </>
  );
}

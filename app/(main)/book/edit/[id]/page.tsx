import BackLink from "@/components/BackLink";
import BookEditor from "@/components/BookEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <BackLink href={`/book/${id}`} label="ブック詳細へ戻る" />
      <BookEditor id={id} />
    </>
  );
}

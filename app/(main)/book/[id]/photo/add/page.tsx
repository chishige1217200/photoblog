import BackLink from "@/components/BackLink";
import BookPhotoAdd from "@/components/BookPhotoAdd";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AddPhotoPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <BackLink href={`/book/${id}`} label="ブック詳細へ戻る" />
      <BookPhotoAdd bookId={id} />
    </>
  );
}

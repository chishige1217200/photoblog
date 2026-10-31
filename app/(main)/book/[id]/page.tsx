import BackLink from "@/components/BackLink";
import BookView from "@/components/BookView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <BackLink href="/book" label="ブック一覧へ戻る" />
      <BookView id={id} />
    </>
  );
}

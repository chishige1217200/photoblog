import BackLink from "@/components/BackLink";
import PhotoEditor from "@/components/PhotoEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPhotoPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <BackLink href="/photo" label="フォト一覧へ戻る" />
      <PhotoEditor id={id} />
    </>
  );
}

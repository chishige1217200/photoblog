import PhotoEditor from "@/components/PhotoEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPhotoPage({ params }: Props) {
  const { id } = await params;
  return <PhotoEditor id={id} />;
}

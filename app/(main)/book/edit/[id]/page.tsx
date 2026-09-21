import BookEditor from "@/components/BookEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBookPage({ params }: Props) {
  const { id } = await params;
  return <BookEditor id={id} />;
}

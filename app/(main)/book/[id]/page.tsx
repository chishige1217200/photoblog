import BookView from "@/components/BookView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  return <BookView id={id} />;
}

import BackLink from "@/components/BackLink";
import BookEditor from "@/components/BookEditor";

export default function Home() {
  return (
    <>
      <BackLink href="/book" label="ブック一覧へ戻る" />
      <BookEditor />
    </>
  );
}

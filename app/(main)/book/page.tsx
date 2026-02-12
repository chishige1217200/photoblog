import BookCover from "@/components/BookCover";

export default function Home() {
  return (
    <div className="flex flex-col">
      <BookCover image="/apple-icon.png" />
      <BookCover image="/apple-icon.png" />
    </div>
  );
}

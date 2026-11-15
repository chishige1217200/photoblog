import Bookshelf from "@/components/BookShelf";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center">
      <div className="flex w-full flex-1 flex-col">
        <Bookshelf />
      </div>
    </div>
  );
}

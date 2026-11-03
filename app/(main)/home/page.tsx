import PageNav from "@/components/PageNav";
import Bookshelf from "@/components/BookShelf";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <PageNav />
      <div className="w-full">
        <Bookshelf scope="all" />
      </div>
    </div>
  );
}

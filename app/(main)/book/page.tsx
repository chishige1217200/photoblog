import PageNav from "@/components/PageNav";
import Bookshelf from "@/components/BookShelf";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center">
      <PageNav />
      {/* shelf を flex-1 にすることで、ナビ + ツールバー + 棚の高さが
          ちょうどビューポートになり、コンテンツが少なくても
          縦スクロールバーが出ない */}
      <div className="flex w-full flex-1 flex-col">
        <Bookshelf />
      </div>
    </div>
  );
}

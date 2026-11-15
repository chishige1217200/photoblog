"use client";
import { Book } from "@/types/PhotoBlog/book";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, HStack } from "@chakra-ui/react";

const PhotoBook = dynamic(() => import("./PhotoBook"), {
  ssr: false,
});

type Props = {
  id: string;
};

// 画面四周の余白と、左右見開きの中央（背表紙）分の隙間。
// PhotoBook に渡すのは「1ページ分」の寸法で、縦横比は PAGE_ASPECT で決める。
const STAGE_PADDING = 16;
const GUTTER = 12;
const PAGE_ASPECT = 3 / 4;
// ポインターがこの深さ（px）より画面上部にある時だけヘッダーを出す
const HOT_ZONE = 120;

export default function BookView({ id }: Props) {
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState(false);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  // ホバーできない端末（タッチ機器など）は、タップでヘッダーの表示/非表示を切り替える
  const [hoverable, setHoverable] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(false);
  // ホバーできる端末は、画面上部のホットゾーンへポインターを運んだ時だけ表示する
  const [inHotZone, setInHotZone] = useState(false);
  const [overPill, setOverPill] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      const res = await fetch(`/api/book/search/${id}`);
      if (!res.ok) {
        setError(true);
        return;
      }
      setBook((await res.json()) as Book);
    };
    fetchBook();
  }, [id]);

  // ウィンドウサイズではなく、実際にブックを配置する領域のサイズを測る
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setStage({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    const apply = () => setHoverable(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (error) {
    return (
      <div ref={stageRef} className="flex h-dvh items-center justify-center">
        <p className="text-lg">このブックを表示できません。</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div ref={stageRef} className="flex h-dvh items-center justify-center">
        <p className="text-lg">読み込み中...</p>
      </div>
    );
  }

  // 横長なら左右見開き、縦長なら単ページで表示する。
  // 見開きは「ページ幅 × 2 + 背表紙分の隙間」なので、幅と高さの両方から1ページ分を決める。
  // 単ページは幅の制限が半分にならないため、縦長の画面で極端に小さくなるのを防げる。
  const innerWidth = stage.width - STAGE_PADDING * 2;
  const innerHeight = stage.height - STAGE_PADDING * 2;
  const portrait = innerWidth < innerHeight;
  const fitWidth = portrait ? innerWidth : innerWidth - GUTTER;
  const pageWidth = Math.max(
    0,
    Math.floor(
      Math.min(fitWidth / (portrait ? 1 : 2), innerHeight * PAGE_ASPECT),
    ),
  );
  const pageHeight = Math.round(pageWidth / PAGE_ASPECT);
  // ホバーできる端末は画面上部のホットゾーンで、できない端末はタップで開閉する
  const showChrome = hoverable ? inHotZone || overPill : chromeVisible;

  const setHotZone = (next: boolean) => {
    setInHotZone((current) => (current === next ? current : next));
  };

  return (
    <div
      ref={stageRef}
      className="group relative h-dvh w-full overflow-hidden"
      onPointerMove={
        hoverable
          ? (event) => setHotZone(event.clientY <= HOT_ZONE)
          : undefined
      }
      onPointerLeave={hoverable ? () => setHotZone(false) : undefined}
      onClick={
        hoverable
          ? undefined
          : (event) => {
              // ページ内（page-flip が作った要素を含む）のタップはページめくり用なので無視する
              const target = event.target as HTMLElement;
              if (target.closest(".stf__parent")) return;
              setChromeVisible((v) => !v);
            }
      }
    >
      {book.photographs && book.photographs.length > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <PhotoBook
            photos={book.photographs}
            book={book}
            width={pageWidth}
            height={pageHeight}
            portrait={portrait}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            まだフォトが登録されていません。
          </p>
        </div>
      )}

      {/* 一覧へ戻るボタンと編集ボタン。常時表示せず、画面上部に触れた時だけ現れる */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3 transition-opacity duration-300 ${
          showChrome
            ? "opacity-100"
            : "opacity-0 group-focus-within:opacity-100"
        }`}
      >
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-black/60 dark:ring-white/10"
          onPointerEnter={() => setOverPill(true)}
          onPointerLeave={() => setOverPill(false)}
        >
          <Button asChild size="xs" variant="outline" colorPalette="gray">
            <Link href="/book">&larr; ブック一覧</Link>
          </Button>
          {(book.isOwner || book.isCollaborator) && (
            <HStack gap="2">
              <Button asChild size="xs" colorPalette="blue">
                <Link href={`/book/edit/${id}`}>編集する</Link>
              </Button>
              <Button asChild size="xs" variant="outline">
                <Link href={`/book/edit/${id}?tab=photos&add=1`}>
                  フォトを追加
                </Link>
              </Button>
            </HStack>
          )}
        </div>
      </div>
    </div>
  );
}

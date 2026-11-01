"use client";
import "@/styles/pageflip.css";
import React, { useEffect, useRef, useState } from "react";
import { PageFlip, SizeType } from "page-flip";
import { Photo } from "@/types/PhotoBlog/photo";
import { Book } from "@/types/PhotoBlog/book";
import Image from "next/image";

type Props = {
  photos: Photo[];
  book?: Book;
  width?: number;
  height?: number;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const PhotoBook: React.FC<Props> = ({
  photos,
  book,
  width = 450,
  height = 650,
}) => {
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);

  const [loadedCount, setLoadedCount] = useState(0);

  const handleImageLoad = () => {
    // キャッシュ済み画像が再度 onLoad を発火させても ready が false に戻らないよう、
    // 上限で止める。ready が戻ると破棄と再初期化が繰り返され、BookView が
    // 一瞬表示された後に消える原因になる。
    setLoadedCount((c) => Math.min(c + 1, photos.length));
  };

  const ready = photos.length > 0 && loadedCount >= photos.length;

  useEffect(() => {
    if (!ready) return;
    if (!bookRef.current) return;
    // 初回レンダリングは GetWindowSize() が 0 を返すため、サイズが確定するまで待機する
    if (width <= 0 || height <= 0) return;

    const container = bookRef.current;
    const pages = Array.from(
      container.querySelectorAll(":scope > .page"),
    ) as HTMLElement[];
    if (pages.length === 0) return;

    // 両開き（2ページ）を表示するには、コンテナの実効幅が「1ページ分の幅 × 2」以上
    // でなければならない。呼び出し側は window.innerWidth（スクロールバー込み）から
    // 幅を計算するため、実測した配置領域より常に数px足りず、page-flip が単ページの
    // 縦表示（portrait）へ落ちていた。配置領域の実測値から1ページ分のサイズを決め直す。
    const parent = container.parentElement;
    let measured = 0;
    if (parent) {
      const parentStyle = getComputedStyle(parent);
      measured =
        parent.getBoundingClientRect().width -
        (parseFloat(parentStyle.paddingLeft) || 0) -
        (parseFloat(parentStyle.paddingRight) || 0);
    }
    const availableWidth = measured > 0 ? Math.floor(measured) : width * 2;
    const pageWidth = Math.max(1, Math.min(width, Math.floor(availableWidth / 2)));
    const pageHeight = Math.max(1, Math.round((pageWidth * height) / width));

    // page-flip はコンテナへ自前のノードを注入し、React が描画したページを内部へ移動し、
    // クラスやスタイルを書き換える。破棄時に元へ戻すため、変更前を控えておく。
    const containerSnapshot = {
      className: container.className,
      style: container.getAttribute("style"),
    };
    const pageSnapshot = pages.map((page) => ({
      page,
      className: page.className,
      style: page.getAttribute("style"),
    }));

    // ページが page-flip の体裁になるまでは重ね描きした状態が見えるため、非表示にする
    container.style.visibility = "hidden";
    container.style.height = `${pageHeight}px`;

    flipRef.current = new PageFlip(container, {
      width: pageWidth,
      height: pageHeight,
      size: "fixed" as SizeType,
      showCover: true,
      useMouseEvents: true,
      mobileScrollSupport: true,
    });

    flipRef.current.on("init", () => {
      container.style.visibility = "visible";
    });
    flipRef.current.loadFromHTML(pages);

    return () => {
      // destroy() はコンテナ自体を削除してしまうため、page-flip が注入した UI だけを消す。
      // コンテナが削除されると再初期化できず、BookView が一瞬表示された後に消える。
      flipRef.current?.getUI().destroy();
      flipRef.current = null;

      // page-flip が書き換えたコンテナとページを、React が描画した状態へ戻す
      container.className = containerSnapshot.className;
      if (containerSnapshot.style === null) container.removeAttribute("style");
      else container.setAttribute("style", containerSnapshot.style);

      for (const { page, className, style } of pageSnapshot) {
        container.appendChild(page);
        page.className = className;
        if (style === null) page.removeAttribute("style");
        else page.setAttribute("style", style);
      }
    };
  }, [ready, photos, width, height]);

  const renderCover = () => (
    <div className="page" data-density="hard">
      <div className="photo-container justify-center text-zinc-950 dark:text-zinc-50">
        {book?.thumbnail?.url ? (
          <div className="image-area">
            <Image
              src={book.thumbnail.url}
              alt={book.title ?? ""}
              width={book.thumbnail.width}
              height={book.thumbnail.height}
              loading="eager"
            />
          </div>
        ) : (
          <h2 className="text-center text-5xl text-gray-900">Page Cover</h2>
        )}
        {book?.title && (
          <h3 className="mt-4 text-center text-2xl text-gray-900">
            {book.title}
          </h3>
        )}
        {book?.subTitle && (
          <p className="mt-2 text-center text-lg text-gray-700">
            {book.subTitle}
          </p>
        )}
        {book?.author && (
          <p className="mt-2 text-center text-sm text-gray-500">
            著者: {book.author}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={bookRef}
      style={{
        width,
        height,
        margin: "0 auto",
        visibility: ready ? "visible" : "hidden",
      }}
    >
      {renderCover()}
      {photos.map((photo) => {
        const isPortrait =
          photo.photograph && photo.photograph.height > photo.photograph.width;

        return (
          <div className="page" key={photo.id}>
            <div
              className={`photo-container ${
                isPortrait ? "portrait" : "landscape"
              }`}
            >
              <div className="image-area">
                {/* <img
                  src={photo.photograph?.url}
                  onLoad={handleImageLoad}
                  alt={photo.title ?? ""}
                /> */}
                <Image
                  src={photo.photograph?.url ?? ""}
                  alt={photo.title ?? ""}
                  width={photo.photograph?.width ?? 0}
                  height={photo.photograph?.height ?? 0}
                  loading="eager"
                  onLoad={handleImageLoad}
                />
              </div>

              <div className="info-area font-medium text-zinc-950 dark:text-zinc-50">
                {photo.title && (
                  <h3 className="text-gray-900">{photo.title}</h3>
                )}
                {photo.caption && (
                  <p className="text-gray-900">{photo.caption}</p>
                )}
                {photo.shotAt && (
                  <p className="shotAt">📅 {formatDate(photo.shotAt)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {photos.length % 2 !== 0 && (
        <div className="page">
          <div className="photo-container justify-center text-zinc-950 dark:text-zinc-50">
            <h2 className="text-center text-5xl">Dummy</h2>
          </div>
        </div>
      )}
      <div className="page" data-density="hard">
        <div className="photo-container justify-center text-zinc-950 dark:text-zinc-50">
          <h2 className="text-center text-5xl">Page Cover</h2>
        </div>
      </div>
    </div>
  );
};

export default PhotoBook;

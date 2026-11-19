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
  // 縦長の画面では単ページ表示になる。その場合はコンテナ幅が1ページ分で足りる。
  portrait?: boolean;
};

// 表紙・裏表紙の革の質感（下地・背表紙側の陰・金枠）。
// .cover-inner の中へ置き、em がページ幅基準でスケールするようにする。
const coverChrome = () => (
  <>
    <div className="cover-surface" aria-hidden />
    <div className="cover-spine" aria-hidden />
    <div className="cover-frame" aria-hidden />
  </>
);

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
  portrait = false,
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

    // page-flip はコンテナ（stf__parent）の幅を測って見開き/単ページを決める。
    // コンテナの実効幅が「1ページ分の幅 × 2」でないと単ページの縦表示へ落ちるため、
    // 実測した配置領域から1ページ分のサイズを決め、コンテナ幅を見開き分へ広げる。
    const parent = container.parentElement;
    let measuredWidth = 0;
    let measuredHeight = 0;
    if (parent) {
      const parentStyle = getComputedStyle(parent);
      const rect = parent.getBoundingClientRect();
      measuredWidth =
        rect.width -
        (parseFloat(parentStyle.paddingLeft) || 0) -
        (parseFloat(parentStyle.paddingRight) || 0);
      measuredHeight =
        rect.height -
        (parseFloat(parentStyle.paddingTop) || 0) -
        (parseFloat(parentStyle.paddingBottom) || 0);
    }

    // 1ページ分の縦横比は呼び出し側が渡した寸法から決まる。
    // ページ高さは「ページ幅 × (1 / 縦横比)」なので、高さ制限から逆算した幅の上限は
    // 「実測高さ × 縦横比」になる。
    // 単ページ表示では幅の制限が 1ページ分なので、見開きより大きくできる。
    const aspect = width / height;
    const spread = portrait ? 1 : 2;
    const limitWidth = measuredWidth > 0 ? measuredWidth / spread : width;
    const limitHeight = measuredHeight > 0 ? measuredHeight * aspect : height;
    const pageWidth = Math.max(
      1,
      Math.floor(Math.min(width, limitWidth, limitHeight)),
    );
    const pageHeight = Math.max(1, Math.round(pageWidth / aspect));

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
  }, [ready, photos, width, height, portrait]);

  const renderCover = () => {
    const thumbnail = book?.thumbnail;

    return (
      <div className="page cover cover--front" data-density="hard">
        <div className="cover-face">
          {coverChrome()}
          <div className="cover-inner">
            <p className="cover-kicker">Photo Album</p>

            {thumbnail?.url && thumbnail.width > 0 && thumbnail.height > 0 ? (
              <figure className="cover-media">
                {/* 台紙を写真の縦横比に合わせて縁取りする */}
                <div
                  className="cover-photo"
                  style={{
                    aspectRatio: `${thumbnail.width} / ${thumbnail.height}`,
                  }}
                >
                  <Image
                    src={thumbnail.url}
                    alt={book?.title ?? ""}
                    width={thumbnail.width}
                    height={thumbnail.height}
                    loading="eager"
                  />
                </div>
              </figure>
            ) : (
              <span className="cover-emblem" aria-hidden />
            )}

            <div className="cover-titles">
              <h2 className="cover-title">{book?.title || "Photoblog"}</h2>
              {book?.subTitle && (
                <p className="cover-subtitle">{book.subTitle}</p>
              )}
              <div className="cover-rule" aria-hidden>
                <span />
              </div>
              {book?.author && <p className="cover-author">{book.author}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBackCover = () => (
    <div className="page cover cover--back" data-density="hard">
      <div className="cover-face">
        {coverChrome()}
        <div className="cover-inner cover-inner--back">
          <span className="cover-emblem" aria-hidden />
          <p className="cover-back-title">{book?.title || "Photoblog"}</p>
          <div className="cover-rule" aria-hidden>
            <span />
          </div>
          <p className="cover-back-note">The End</p>
        </div>
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
      {photos.length % 2 !== 0 && <div className="page" />}
      {renderBackCover()}
    </div>
  );
};

export default PhotoBook;

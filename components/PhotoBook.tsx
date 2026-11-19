"use client";
import "@/styles/pageflip.css";
import React, { useEffect, useId, useRef, useState } from "react";
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

// レンズを模したエンブレム。
// 実際の絞りと同じく、各羽根は自分のピボットピン（半径 Rp の円周上の点 P_i）を
// 軸に --iris 度だけ「回転」する。羽根は鏡筒（半径 R）から切り出した円弧 edge を
// 持ち、内側に寄せた切り取り円（半径 rho）で刃先を作る。回転すると切り取り円の
// 中心 C がレンズ中心へ近づき、隣り合う羽根の C との距離分だけ正八角形の開口が開く。
//   m(φ) = |C(φ)| = sqrt(R² + a² + 2·R·a·cos(β + φ))   （a = |C| の基準位置, β = 位相）
//   開口の内接円半径 r(φ) = sqrt(rho² − m²sin²(π/16)) − m·cos(π/16)
// 数値解（R=40, rho=30, a=45）で β=139.2°, φmax=26.0° となり、
//   --iris: 0   → r = 0（完全閉）
//   --iris: 7   → r ≈ 4.8（既定・わずかに開いた状態）
//   --iris: 26  → r ≈ 18（鏡筒 R=40 に対し f/2.2 相当の大きな開口）
// page-flip は button 要素上のポインター操作をページめくりに使わないため、
// タップしてもページがめくれず、モバイルでも安全に操作できる。
const LENS_R = 40;
// 羽根の形状は viewBox 絶対座標で保持し、--px/--py にその羽根の回転中心（= ピボットピン）を持たせる。
// CSS 側で transform-box: view-box / transform-origin: var(--px) var(--py) を当てることで、
// 刃が実際に「見えるピンの上で」回転する。
const BLADES: { d: string; px: number; py: number }[] = [
  { d: "M 26.05 82.04 A 40 40 0 1 1 84.5 70.24 A 30 30 0 0 0 26.05 82.04 Z", px: 90, py: 50 },
  { d: "M 10.41 55.72 A 40 40 0 1 1 60.09 88.71 A 30 30 0 0 0 10.41 55.72 Z", px: 78.28, py: 78.28 },
  { d: "M 17.96 26.05 A 40 40 0 1 1 29.76 84.5 A 30 30 0 0 0 17.96 26.05 Z", px: 50, py: 90 },
  { d: "M 44.28 10.41 A 40 40 0 1 1 11.29 60.09 A 30 30 0 0 0 44.28 10.41 Z", px: 21.72, py: 78.28 },
  { d: "M 73.95 17.96 A 40 40 0 1 1 15.5 29.76 A 30 30 0 0 0 73.95 17.96 Z", px: 10, py: 50 },
  { d: "M 89.59 44.28 A 40 40 0 1 1 39.91 11.29 A 30 30 0 0 0 89.59 44.28 Z", px: 21.72, py: 21.72 },
  { d: "M 82.04 73.95 A 40 40 0 1 1 70.24 15.5 A 30 30 0 0 0 82.04 73.95 Z", px: 50, py: 10 },
  { d: "M 55.72 89.59 A 40 40 0 1 1 88.71 39.91 A 30 30 0 0 0 55.72 89.59 Z", px: 78.28, py: 21.72 },
];

const LensEmblem = ({ label }: { label: string }) => {
  const uid = useId().replace(/[:]/g, "");
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      className={`cover-emblem${open ? " is-open" : ""}`}
      aria-label={label}
      aria-pressed={open}
      onClick={() => setOpen((v) => !v)}
    >
      <svg viewBox="0 0 100 100" aria-hidden focusable="false">
        <defs>
          <clipPath id={`${uid}-barrel`}>
            <circle cx="50" cy="50" r={LENS_R} />
          </clipPath>
          {/* 羽根ごとの bbox に合わせて陰影を入れる（デフォルトの objectBoundingBox） */}
          <linearGradient id={`${uid}-blade`} x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#8a5054" />
            <stop offset="0.5" stopColor="#5c2b2e" />
            <stop offset="1" stopColor="#331619" />
          </linearGradient>
          <radialGradient
            id={`${uid}-glass`}
            cx="0.36"
            cy="0.3"
            r="0.78"
          >
            <stop offset="0" stopColor="#9a6066" />
            <stop offset="0.55" stopColor="#4a2226" />
            <stop offset="1" stopColor="#1d0c0e" />
          </radialGradient>
        </defs>

        {/* 鏡筒の奥にあるガラス（開口部から見えた色） */}
        <circle cx="50" cy="50" r={LENS_R} fill={`url(#${uid}-glass)`} />

        {/* ガラス上の反射。絞り羽根より奥（＝開口部から見える分だけ光る）に置く。
            閉じているときは羽根に隠れて構わないので、左上（ガラスの明るい位置）に寄せ、
            傾きは立てて（-24° → -40°）開口の対角に沿う形にした。
            鏡筒の縁より外には見えないのでクリップする。 */}
        <g clipPath={`url(#${uid}-barrel)`}>
          <ellipse
            className="cover-glare"
            cx="44"
            cy="40"
            rx="13"
            ry="7"
            transform="rotate(-40 44 40)"
          />
        </g>

        {/* 絞り羽根。鏡筒の縁より外には見えないのでクリップする。
            回転は path 自身の CSS transform（transform-box: view-box）で行うため、
            transform 属性は使わない（属性と CSS が競合すると属性が消える）。 */}
        <g clipPath={`url(#${uid}-barrel)`}>
          {BLADES.map((blade, i) => (
            <path
              key={i}
              className="cover-blade"
              d={blade.d}
              fill={`url(#${uid}-blade)`}
              style={{ "--px": `${blade.px}px`, "--py": `${blade.py}px` } as React.CSSProperties}
            />
          ))}
        </g>

        {/* 各羽根のピボットピン（＝回転中心と同一座標） */}
        {BLADES.map((blade, i) => (
          <circle key={i} className="cover-pin" cx={blade.px} cy={blade.py} r="1.6" />
        ))}
      </svg>
    </button>
  );
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
            <p className="cover-kicker">Photo Blog</p>

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
              <LensEmblem label="エンブレム（絞り羽根）" />
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
          <LensEmblem label="エンブレム（絞り羽根）" />
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

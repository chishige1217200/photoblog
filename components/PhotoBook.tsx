"use client";

import React, { useEffect, useRef, useState } from "react";
import { PageFlip, SizeType } from "page-flip";

type Props = {
  images: string[];
  width?: number;
  height?: number;
};

const PhotoBook: React.FC<Props> = ({ images, width = 400, height = 600 }) => {
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);

  const [ready, setReady] = useState(false);

  // 画像が全部読み込まれたら ready にする
  const handleImageLoad = () => {
    setReady(true);
  };

  useEffect(() => {
    if (!ready) return;
    if (!bookRef.current) return;

    const pages = Array.from(
      bookRef.current.querySelectorAll(".page"),
    ) as HTMLElement[];

    if (pages.length === 0) return;

    flipRef.current = new PageFlip(bookRef.current, {
      width,
      height,
      size: "fixed" as SizeType,
      showCover: true,
      useMouseEvents: true,
      minWidth: 300,
      maxWidth: 1000,
      mobileScrollSupport: false,
    });

    flipRef.current.loadFromHTML(pages);

    return () => {
      flipRef.current?.destroy();
      flipRef.current = null;
    };
  }, [ready, images, width, height]);

  return (
    <div
      ref={bookRef}
      style={{
        width,
        height,
        margin: "0 auto",
      }}
    >
      {images.map((src, i) => (
        <div className="page w-full" key={i}>
          <img
            src={src}
            onLoad={handleImageLoad}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#fff",
              borderColor: "#ccc",
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          />
          AAA
        </div>
      ))}
    </div>
  );
};

export default PhotoBook;

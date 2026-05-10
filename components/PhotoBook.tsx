"use client";
import "@/styles/pageflip.css";
import React, { useEffect, useRef, useState } from "react";
import { PageFlip, SizeType } from "page-flip";
import { Photo } from "@/types/PhotoBlog/photo";
import Image from "next/image";

type Props = {
  photos: Photo[];
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

const PhotoBook: React.FC<Props> = ({ photos, width = 450, height = 650 }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);

  const [loadedCount, setLoadedCount] = useState(0);

  const handleImageLoad = () => {
    setLoadedCount((c) => c + 1);
  };

  const ready = loadedCount === photos.length && photos.length > 0;

  useEffect(() => {
    if (!ready) return;
    if (!bookRef.current) return;
    if (!loading) return;

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
      mobileScrollSupport: true,
    });

    flipRef.current.loadFromHTML(pages);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);

    return () => {
      flipRef.current?.destroy();
      flipRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, photos, width, height]);

  return (
    <div
      ref={bookRef}
      style={{
        width,
        height,
        margin: "0 auto",
        visibility: loading ? "hidden" : "visible",
      }}
    >
      <div className="page" data-density="hard">
        <div className="photo-container justify-center text-zinc-950 dark:text-zinc-50">
          <h2 className="text-center text-5xl text-gray-900">Page Cover</h2>
        </div>
      </div>
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

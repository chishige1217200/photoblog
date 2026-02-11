"use client";
import { GetWindowSize } from "@/hook/GetWindowSize";
import { Photos } from "@/types/PhotoBlog/photo";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PhotoBook = dynamic(() => import("./PhotoBook"), {
  ssr: false,
});

export default function PhotoBookLoader() {
  const [initializeFlag, setInitializeFlag] = useState(false);
  const [photos, setPhotos] = useState<Photos | null>(null);

  const fetchPhotos = async () => {
    const response = await fetch("/api/photo/search");
    const photos = (await response.json()) as Photos;
    setPhotos(photos);
  };

  const { width, height } = GetWindowSize();
  console.log(width, height);

  useEffect(() => {
    if (!initializeFlag) {
      setInitializeFlag(true);
      fetchPhotos();
    }
  }, [initializeFlag]);
  return (
    <div className="p-2">
      <PhotoBook
        photos={photos?.contents || []}
        width={(width - 32) / 2}
        height={height - 32}
      />
    </div>
  );
}

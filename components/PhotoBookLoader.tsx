"use client";

import { CmsPhotos } from "@/types/microCMS/photo";
import { Photos } from "@/types/PhotoBlog/photo";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PhotoBook = dynamic(() => import("./PhotoBook"), {
  ssr: false,
});

export default function PhotoBookLoader() {
  const [initializeFlag, setInitializeFlag] = useState(false);
  const [photos, setPhotos] = useState<CmsPhotos | null>(null);

  const fetchPhotos = async () => {
    const response = await fetch("/api/photo");
    const photos = (await response.json()) as Photos;
    setPhotos(photos);
  };

  useEffect(() => {
    if (!initializeFlag) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitializeFlag(true);
      fetchPhotos();
    }
  }, [initializeFlag]);
  return <PhotoBook images={photos?.contents.map((c) => c.photograph?.url || "") || []} width={800} height={800} />;
}

"use client";
import { Photos } from "@/types/photos";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function PhotoView() {
  const [initializeFlag, setInitializeFlag] = useState(false);
  const [photos, setPhotos] = useState<Photos | null>(null);

  const fetchPhotos = async () => {
    const response = await fetch("api/photos");
    const photos = await response.json();
    setPhotos(photos);
  };

  useEffect(() => {
    if (!initializeFlag) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitializeFlag(true);
      fetchPhotos();
    }
  }, [initializeFlag]);

  console.log(photos != null);

  return (
    <>
      {photos != null ? (
        <>
          {photos.contents.map((c) => (
            <React.Fragment key={c.id}>
              <Image
                src={c.photograph.url}
                width={c.photograph.width / 4}
                height={c.photograph.height / 4}
                alt={`${c.title} ${c.caption}`}
              />
              <h2>{c.title}</h2>
              <h3>{c.caption}</h3>
            </React.Fragment>
          ))}
        </>
      ) : (
        <>読み込み中...</>
      )}
    </>
  );
}

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

  return (
    <>
      {photos != null ? (
        <>
          {photos.contents.map((c) => (
            <React.Fragment key={c.id}>
              <div className="flex flex-col items-center py-4">
                <Image
                  src={c.photograph.url}
                  width={c.photograph.width / 4}
                  height={c.photograph.height / 4}
                  alt={`${c.title} ${c.caption}`}
                />
                <h2>{c.title}</h2>
                <h3>
                  {(c.title || c.caption) && c.shotAt
                    ? new Date(c.shotAt).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false, // 24時間表記
                      })
                    : ""}
                </h3>
                <h3>{c.caption}</h3>
              </div>
            </React.Fragment>
          ))}
        </>
      ) : (
        <>読み込み中...</>
      )}
    </>
  );
}

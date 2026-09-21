"use client";
import "@/styles/photoboard.css";
import { Photo } from "@/types/PhotoBlog/photo";
import { useEffect, useState } from "react";

export default function PhotoBoard() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      const res = await fetch("/api/photo/search?limit=100");
      if (res.ok) {
        const data = (await res.json()) as { contents: Photo[] };
        setPhotos(data.contents);
      }
      setLoading(false);
    };
    fetchPhotos();
  }, []);

  return (
    <div className="bookshelf">
      {loading ? (
        <p className="title">読み込み中...</p>
      ) : (
        photos.map((photo) => (
          <div key={photo.id} className="book-item">
            <div className="book">
              {photo.photograph?.url ? (
                <img src={photo.photograph.url} alt={photo.title ?? ""} />
              ) : (
                <div className="book" />
              )}
            </div>
            <p className="title">{photo.title ?? "無題"}</p>
          </div>
        ))
      )}
    </div>
  );
}

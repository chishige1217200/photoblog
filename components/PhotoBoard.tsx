"use client";
import "@/styles/photoboard.css";
import Link from "next/link";

type Photo = {
  id: number;
  image: string;
};

const books: Photo[] = [
  { id: 1,  image: "https://picsum.photos/200/300?1" },
  { id: 2,  image: "https://picsum.photos/200/300?2" },
  { id: 3,  image: "https://picsum.photos/200/300?3" },
  { id: 4,  image: "https://picsum.photos/200/300?4" },
  { id: 5,  image: "https://picsum.photos/200/300?5" },
];

export default function PhotoBoard() {
  return (
    <div className="bookshelf">
      {books.map((book) => (
        <Link key={book.id} href={`/books/${book.id}`} className="book-item">
          <div className="book">
            <img src={book.image} />
          </div>
        </Link>
      ))}
    </div>
  );
}

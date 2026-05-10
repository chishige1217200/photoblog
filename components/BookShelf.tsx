"use client";
import "@/styles/bookshelf.css";
import { AbsoluteCenter, Box, Center, Text } from "@chakra-ui/react";
import Link from "next/link";

type Book = {
  id: number;
  title: string;
  image: string;
};

const books: Book[] = [
  { id: 1, title: "My First Book", image: "https://picsum.photos/200/300?1" },
  { id: 2, title: "Adventure Story", image: "https://picsum.photos/200/300?2" },
  { id: 3, title: "Design Notes", image: "https://picsum.photos/200/300?3" },
  { id: 4, title: "Travel Diary", image: "https://picsum.photos/200/300?4" },
  { id: 5, title: "Photo Album", image: "https://picsum.photos/200/300?5" },
];

export default function Bookshelf() {
  return (
    <div className="bookshelf">
      <Link href={`/book/edit`} className="book-item">
        <div className="book">
          <Box position="relative" h="100%">
            <AbsoluteCenter>
              <Text textStyle="6xl">+</Text>
            </AbsoluteCenter>
          </Box>
        </div>
        <p className="title">New Book</p>
      </Link>
      {books.map((book) => (
        <Link key={book.id} href={`/book/${book.id}`} className="book-item">
          <div className="book">
            <img src={book.image} alt={book.title} />
          </div>
          <p className="title">{book.title}</p>
        </Link>
      ))}
    </div>
  );
}

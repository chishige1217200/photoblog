import { Book, Books } from "../PhotoBlog/book";
import { CmsPhoto, convertToPhoto } from "./photo";

export type CmsBook = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  revisedAt?: string;
  title?: string;
  subTitle?: string;
  author?: string;
  photographs?: CmsPhoto[];
  isPrivate?: boolean;
  allowUserIds?: string;
  collaborateUserIds?: string;
  ownerUserId?: string;
};

export type CmsBooks = {
  contents: CmsBook[];
  totalCount: number;
  offset: number;
  limit: number;
};

export const convertToList = (allowedUserIds?: string): string[] => {
  if (!allowedUserIds) {
    return [];
  }
  return allowedUserIds
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
};

export const isOwner = (book: CmsBook, ownerUserId?: string): boolean => {
  return ownerUserId !== undefined && book.ownerUserId === ownerUserId;
};

export const convertToBook = (book: CmsBook, ownerUserId?: string): Book => {
  return {
    id: book.id,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    publishedAt: book.publishedAt,
    revisedAt: book.revisedAt,
    title: book.title,
    subTitle: book.subTitle,
    author: book.author,
    photographs:
      book.photographs?.map((photo) => convertToPhoto(photo, ownerUserId)) ||
      [],
    isPrivate: book.isPrivate,
    allowUserIds: book.allowUserIds,
    collaborateUserIds: book.collaborateUserIds,
    isOwner: isOwner(book, ownerUserId),
  };
};

export const convertToBooks = (
  cmsBooks: CmsBooks,
  ownerUserId?: string,
): Books => {
  return {
    contents: cmsBooks.contents.map((book) => convertToBook(book, ownerUserId)),
    totalCount: cmsBooks.totalCount,
    offset: cmsBooks.offset,
    limit: cmsBooks.limit,
  };
};

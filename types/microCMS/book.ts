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

export const convertFromList = (userIdList: string[]): string => {
  return userIdList.join(",");
};

export const isOwner = (book: CmsBook, ownerUserId: string): boolean => {
  return ownerUserId !== undefined && book.ownerUserId === ownerUserId;
};

export const isCollaborator = (book: CmsBook, userId: string): boolean => {
  if (!userId || !book.collaborateUserIds) {
    return false;
  }
  return convertToList(book.collaborateUserIds).includes(userId);
};

export const isAllowedUser = (book: CmsBook, userId: string): boolean => {
  if (!userId || !book.allowUserIds) {
    return false;
  }
  return convertToList(book.allowUserIds).includes(userId);
};

export const convertToBook = (book: CmsBook, userId: string): Book => {
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
      book.photographs?.map((photo) => convertToPhoto(photo, userId)) || [],
    isPrivate: book.isPrivate,
    isAllowedUser: isAllowedUser(book, userId),
    isCollaborator: isCollaborator(book, userId),
    isOwner: isOwner(book, userId),
  };
};

export const convertToBooks = (
  cmsBooks: CmsBooks,
  userId: string,
): Books => {
  return {
    contents: cmsBooks.contents.map((book) => convertToBook(book, userId)),
    totalCount: cmsBooks.totalCount,
    offset: cmsBooks.offset,
    limit: cmsBooks.limit,
  };
};

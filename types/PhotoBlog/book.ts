import { Photo } from "./photo";

export type Book = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  revisedAt?: string;
  title?: string;
  subTitle?: string;
  author?: string;
  photographs?: Photo[];
  isPrivate?: boolean;
  isAllowedUser?: boolean;
  isCollaborator?: boolean;
  isOwner?: boolean;
};

export type Books = {
  contents: Book[];
  totalCount: number;
  offset: number;
  limit: number;
};

import { Photos } from "./photos";

export type Books = {
  contents: {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    revisedAt?: string;
    title?: string;
    subTitle?: string;
    author?: string;
    photographs?: Photos[];
    isPrivate?: boolean;
    allowUserIds?: string;
    collaborateUserIds?: string;
    ownerUserId?: string;
  }[];
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

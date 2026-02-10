import { Photo, Photos } from "../PhotoBlog/photo";

export type CmsPhoto = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  revisedAt?: string;
  photograph?: {
    url: string;
    height: number;
    width: number;
  };
  title?: string;
  caption?: string;
  shotAt?: string;
  ownerUserId?: string;
};

export type CmsPhotos = {
  contents: CmsPhoto[];
  totalCount: number;
  offset: number;
  limit: number;
};

export const isOwner = (photo: CmsPhoto, ownerUserId?: string): boolean => {
  return ownerUserId !== undefined && photo.ownerUserId === ownerUserId;
};

export const convertToPhoto = (
  photo: CmsPhoto,
  ownerUserId?: string,
): Photo => {
  return {
    ...photo,
    isOwner: isOwner(photo, ownerUserId),
  };
};

export const convertToPhotos = (
  cmsPhotos: CmsPhotos,
  ownerUserId?: string,
): Photos => {
  return {
    contents: cmsPhotos.contents.map((photo) =>
      convertToPhoto(photo, ownerUserId),
    ),
    totalCount: cmsPhotos.totalCount,
    offset: cmsPhotos.offset,
    limit: cmsPhotos.limit,
  };
};

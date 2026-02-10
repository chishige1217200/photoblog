export type Photo = {
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
  isOwner: boolean;
};

export type Photos = {
  contents: Photo[];
  totalCount: number;
  offset: number;
  limit: number;
};

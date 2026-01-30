export type Photos = {
  contents: {
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
  }[];
  totalCount: number;
  offset: number;
  limit: number;
}

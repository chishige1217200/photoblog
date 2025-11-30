export interface Photos {
  contents: {
    id: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    revisedAt: string;
    photograph: {
      url: string;
      height: number;
      width: number;
    };
    title: string;
    caption: string;
    userId: string;
  }[];
  totalCount: number;
  offset: number;
  limit: number;
}

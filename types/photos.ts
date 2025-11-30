export interface Photos {
  contents: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date;
    revisedAt: Date;
    photograph: {
      url: string;
      height: number;
      width: number;
    };
    title: string;
    caption: string;
    userId: string;
    shotAt: Date;
  }[];
  totalCount: number;
  offset: number;
  limit: number;
}

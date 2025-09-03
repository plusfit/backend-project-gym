export class Reward {
  id!: string;
  name!: string;
  description?: string;
  pointsRequired!: number;
  enabled!: boolean;
  totalExchanges!: number;
  imageUrl?: string;
  imagePath?: string;
  mediaType?: 'image' | 'video';
  createdAt!: Date;
  updatedAt!: Date;
}

export interface RewardFilters {
  search?: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export interface RewardResponse {
  data: Reward[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}
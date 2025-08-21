export class Premio {
  id!: string;
  name!: string;
  description?: string;
  pointsRequired!: number;
  enabled!: boolean;
  totalCanjes!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export interface PremioFilters {
  search?: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export interface PremioResponse {
  data: Premio[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}
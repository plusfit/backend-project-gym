import { ExchangeStatus } from '@/src/context/shared/enums/exchange-status.enum';

export class Exchange {
  id!: string;
  rewardId!: string;
  rewardName!: string;
  rewardImageUrl?: string;
  rewardImagePath?: string;
  rewardMediaType?: 'image' | 'video';
  clientId!: string;
  clientName!: string;
  clientEmail!: string;
  adminId?: string;
  adminName?: string;
  pointsUsed!: number;
  exchangeDate!: Date;
  status!: ExchangeStatus;
  createdAt!: Date;
  updatedAt!: Date;
}

export interface ExchangeFilters {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: ExchangeStatus;
  page?: number;
  limit?: number;
}

export interface ExchangeResponse {
  data: Exchange[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface ExchangeRequest {
  rewardId: string;
  clientId: string;
  adminId?: string;
}

export interface ExchangeResult {
  success: boolean;
  message: string;
  remainingPoints?: number;
  exchange?: Exchange;
}
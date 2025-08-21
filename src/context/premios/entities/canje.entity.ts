export class Canje {
  id!: string;
  premioId!: string;
  premioName!: string;
  clienteId!: string;
  clienteName!: string;
  clienteEmail!: string;
  adminId?: string;
  adminName?: string;
  pointsUsed!: number;
  canjeDate!: Date;
  status!: 'completed' | 'pending' | 'cancelled';
  createdAt!: Date;
  updatedAt!: Date;
}

export interface CanjeFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  page?: number;
  limit?: number;
}

export interface CanjeResponse {
  data: Canje[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface CanjeRequest {
  premioId: string;
  clienteId: string;
  adminId?: string;
}

export interface CanjeResult {
  success: boolean;
  message: string;
  puntosRestantes?: number;
  canje?: Canje;
}
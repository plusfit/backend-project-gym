import { Exchange, ExchangeFilters, ExchangeResponse } from '../entities/exchange.entity';

export abstract class ExchangeRepository {
  abstract create(exchange: Partial<Exchange>): Promise<Exchange>;
  abstract findAll(filters: ExchangeFilters): Promise<ExchangeResponse>;
  abstract findById(id: string): Promise<Exchange | null>;
  abstract findByClientId(clientId: string): Promise<Exchange[]>;
  abstract findByRewardId(rewardId: string): Promise<Exchange[]>;
  abstract countByRewardId(rewardId: string): Promise<number>;
  abstract update(id: string, exchange: Partial<Exchange>): Promise<Exchange | null>;
  abstract delete(id: string): Promise<boolean>;
}
import { Reward, RewardFilters, RewardResponse } from '../entities/reward.entity';

export abstract class RewardRepository {
  abstract create(reward: Partial<Reward>): Promise<Reward>;
  abstract findAll(filters: RewardFilters): Promise<RewardResponse>;
  abstract findById(id: string): Promise<Reward | null>;
  abstract findByName(name: string): Promise<Reward | null>;
  abstract findNotDisabled(): Promise<Reward[]>;
  abstract update(id: string, reward: Partial<Reward>): Promise<Reward | null>;
  abstract delete(id: string): Promise<boolean>;
  abstract incrementExchanges(id: string): Promise<void>;
  abstract toggleDisabled(id: string): Promise<Reward | null>;
}
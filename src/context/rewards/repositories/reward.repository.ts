import { Reward } from "../entities/reward.entity";

export interface RewardFilters {
	name?: string;
	isActive?: boolean;
	minRequiredDays?: number;
	maxRequiredDays?: number;
}

export abstract class RewardRepository {
	abstract create(reward: Partial<Reward>): Promise<Reward>;
	abstract findAll(page: number, limit: number, filters?: RewardFilters): Promise<{
		rewards: Reward[];
		total: number;
	}>;
	abstract findById(id: string): Promise<Reward | null>;
	abstract findByRequiredDays(requiredDays: number): Promise<Reward | null>;
	abstract findActiveRewards(): Promise<Reward[]>;
	abstract update(id: string, reward: Partial<Reward>): Promise<Reward | null>;
	abstract delete(id: string): Promise<boolean>;
}
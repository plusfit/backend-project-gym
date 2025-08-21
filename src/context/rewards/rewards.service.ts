import { ConflictException,Injectable, NotFoundException } from "@nestjs/common";

import { CreateRewardDto } from "./dto/create-reward.dto";
import { GetRewardsDto } from "./dto/get-rewards.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";
import { Reward } from "./entities/reward.entity";
import { RewardFilters,RewardRepository } from "./repositories/reward.repository";

@Injectable()
export class RewardsService {
	constructor(private readonly rewardRepository: RewardRepository) {}

	async create(createRewardDto: CreateRewardDto): Promise<Reward> {
		// Check if a reward with the same required days already exists
		const existingReward = await this.rewardRepository.findByRequiredDays(createRewardDto.requiredDays);
		if (existingReward) {
			throw new ConflictException(`Ya existe una recompensa para ${createRewardDto.requiredDays} días`);
		}

		return this.rewardRepository.create(createRewardDto);
	}

	async findAll(queryDto: GetRewardsDto): Promise<{
		rewards: Reward[];
		total: number;
		page: number;
		limit: number;
	}> {
		const { page = 1, limit = 10, name, isActive, minRequiredDays, maxRequiredDays } = queryDto;
		
		const filters: RewardFilters = {
			name,
			isActive,
			minRequiredDays,
			maxRequiredDays,
		};

		const result = await this.rewardRepository.findAll(page, limit, filters);

		return {
			...result,
			page,
			limit,
		};
	}

	async findOne(id: string): Promise<Reward> {
		const reward = await this.rewardRepository.findById(id);
		if (!reward) {
			throw new NotFoundException("Recompensa no encontrada");
		}
		return reward;
	}

	async findByRequiredDays(requiredDays: number): Promise<Reward | null> {
		return this.rewardRepository.findByRequiredDays(requiredDays);
	}

	async findActiveRewards(): Promise<Reward[]> {
		return this.rewardRepository.findActiveRewards();
	}

	async update(id: string, updateRewardDto: UpdateRewardDto): Promise<Reward> {
		// If updating required days, check for conflicts
		if (updateRewardDto.requiredDays) {
			const existingReward = await this.rewardRepository.findByRequiredDays(updateRewardDto.requiredDays);
			if (existingReward && existingReward.id !== id) {
				throw new ConflictException(`Ya existe una recompensa para ${updateRewardDto.requiredDays} días`);
			}
		}

		const updatedReward = await this.rewardRepository.update(id, updateRewardDto);
		if (!updatedReward) {
			throw new NotFoundException("Recompensa no encontrada");
		}
		return updatedReward;
	}

	async remove(id: string): Promise<void> {
		const deleted = await this.rewardRepository.delete(id);
		if (!deleted) {
			throw new NotFoundException("Recompensa no encontrada");
		}
	}

	async toggleActive(id: string): Promise<Reward> {
		const reward = await this.findOne(id);
		return this.update(id, { isActive: !reward.isActive });
	}
}
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Reward } from "../entities/reward.entity";
import { RewardDocument } from "../schemas/reward.schema";
import { RewardFilters,RewardRepository } from "./reward.repository";

@Injectable()
export class MongoRewardRepository extends RewardRepository {
	constructor(
		@InjectModel("Reward")
		private readonly rewardModel: Model<RewardDocument>,
	) {
		super();
	}

	async create(reward: Partial<Reward>): Promise<Reward> {
		const newReward = new this.rewardModel(reward);
		const savedReward = await newReward.save();
		return this.mapToEntity(savedReward);
	}

	async findAll(page: number, limit: number, filters?: RewardFilters): Promise<{
		rewards: Reward[];
		total: number;
	}> {
		const query = this.buildFilterQuery(filters);
		
		const [rewards, total] = await Promise.all([
			this.rewardModel
				.find(query)
				.sort({ requiredDays: 1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.exec(),
			this.rewardModel.countDocuments(query).exec(),
		]);

		return {
			rewards: rewards.map(this.mapToEntity),
			total,
		};
	}

	async findById(id: string): Promise<Reward | null> {
		const reward = await this.rewardModel.findById(id).exec();
		return reward ? this.mapToEntity(reward) : null;
	}

	async findByRequiredDays(requiredDays: number): Promise<Reward | null> {
		const reward = await this.rewardModel.findOne({ requiredDays, isActive: true }).exec();
		return reward ? this.mapToEntity(reward) : null;
	}

	async findActiveRewards(): Promise<Reward[]> {
		const rewards = await this.rewardModel
			.find({ isActive: true })
			.sort({ requiredDays: 1 })
			.exec();
		
		return rewards.map(this.mapToEntity);
	}

	async update(id: string, reward: Partial<Reward>): Promise<Reward | null> {
		const updatedReward = await this.rewardModel
			.findByIdAndUpdate(id, reward, { new: true })
			.exec();
		
		return updatedReward ? this.mapToEntity(updatedReward) : null;
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.rewardModel.findByIdAndDelete(id).exec();
		return !!result;
	}

	private buildFilterQuery(filters?: RewardFilters): any {
		const query: any = {};

		if (filters?.name) {
			query.name = { $regex: filters.name, $options: "i" };
		}

		if (filters?.isActive !== undefined) {
			query.isActive = filters.isActive;
		}

		if (filters?.minRequiredDays !== undefined) {
			query.requiredDays = { ...query.requiredDays, $gte: filters.minRequiredDays };
		}

		if (filters?.maxRequiredDays !== undefined) {
			query.requiredDays = { ...query.requiredDays, $lte: filters.maxRequiredDays };
		}

		return query;
	}

	private mapToEntity(document: RewardDocument): Reward {
		return {
			id: (document._id as Types.ObjectId).toString(),
			name: document.name,
			description: document.description,
			requiredDays: document.requiredDays,
			isActive: document.isActive,
			createdAt: (document as any).createdAt,
			updatedAt: (document as any).updatedAt,
		};
	}
}
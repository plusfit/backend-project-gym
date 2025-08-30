import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Reward, RewardFilters, RewardResponse } from '../entities/reward.entity';
import { Reward as RewardSchema, RewardDocument } from '../schemas/reward.schema';
import { RewardRepository } from './reward.repository';

@Injectable()
export class MongoRewardRepository extends RewardRepository {
  constructor(
    @InjectModel(RewardSchema.name)
    private readonly rewardModel: Model<RewardDocument>,
  ) {
    super();
  }

  async create(reward: Partial<Reward>): Promise<Reward> {
    const createdReward = new this.rewardModel(reward);
    const savedReward = await createdReward.save();
    return this.mapToEntity(savedReward);
  }

  async findAll(filters: RewardFilters): Promise<RewardResponse> {
    const { search, enabled, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (enabled !== undefined) {
      query.enabled = enabled;
    }

    // Execute query with pagination
    const [data, totalCount] = await Promise.all([
      this.rewardModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.rewardModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: data.map(doc => this.mapToEntity(doc)),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    };
  }

  async findById(id: string): Promise<Reward | null> {
    const reward = await this.rewardModel.findById(id).exec();
    return reward ? this.mapToEntity(reward) : null;
  }

  async findByName(name: string): Promise<Reward | null> {
    const reward = await this.rewardModel.findOne({ name }).exec();
    return reward ? this.mapToEntity(reward) : null;
  }

  async findEnabled(): Promise<Reward[]> {
    const rewards = await this.rewardModel
      .find({ enabled: true })
      .sort({ createdAt: -1 })
      .exec();
    return rewards.map(doc => this.mapToEntity(doc));
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

  async incrementExchanges(id: string): Promise<void> {
    await this.rewardModel
      .findByIdAndUpdate(id, { $inc: { totalExchanges: 1 } })
      .exec();
  }

  async toggleEnabled(id: string): Promise<Reward | null> {
    const reward = await this.rewardModel.findById(id).exec();
    if (!reward) return null;

    reward.enabled = !reward.enabled;
    const updatedReward = await reward.save();
    return this.mapToEntity(updatedReward);
  }

  private mapToEntity(doc: RewardDocument): Reward {
    return {
      id: doc._id?.toString() || '',
      name: doc.name,
      description: doc.description,
      pointsRequired: doc.pointsRequired,
      enabled: doc.enabled,
      totalExchanges: doc.totalExchanges,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
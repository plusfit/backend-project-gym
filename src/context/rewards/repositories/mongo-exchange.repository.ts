import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Exchange, ExchangeFilters, ExchangeResponse } from '../entities/exchange.entity';
import { Exchange as ExchangeSchema,ExchangeDocument } from '../schemas/exchange.schema';
import { ExchangeRepository } from './exchange.repository';

@Injectable()
export class MongoExchangeRepository extends ExchangeRepository {
  constructor(
    @InjectModel(ExchangeSchema.name)
    private readonly exchangeModel: Model<ExchangeDocument>,
  ) {
    super();
  }

  async create(exchange: Partial<Exchange>): Promise<Exchange> {
    const createdExchange = new this.exchangeModel(exchange);
    const savedExchange = await createdExchange.save();
    return this.mapToEntity(savedExchange);
  }

  async findAll(filters: ExchangeFilters): Promise<ExchangeResponse> {
    const { dateFrom, dateTo, search, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.exchangeDate = {};
      if (dateFrom) {
        query.exchangeDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.exchangeDate.$lte = new Date(dateTo);
      }
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { rewardName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Execute query with pagination and populate reward datanpm
    const [data, totalCount] = await Promise.all([
      this.exchangeModel
        .find(query)
        .populate({
          path: 'rewardId',
          select: 'imageUrl imagePath mediaType',
          model: 'Reward'
        })
        .sort({ exchangeDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.exchangeModel.countDocuments(query).exec(),
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

  async findById(id: string): Promise<Exchange | null> {
    const exchange = await this.exchangeModel
      .findById(id)
      .populate({
        path: 'rewardId',
        select: 'imageUrl imagePath mediaType',
        model: 'Reward'
      })
      .exec();
    return exchange ? this.mapToEntity(exchange) : null;
  }

  async findByClientId(clientId: string): Promise<Exchange[]> {
    const exchanges = await this.exchangeModel
      .find({ clientId })
      .populate({
        path: 'rewardId',
        select: 'imageUrl imagePath mediaType',
        model: 'Reward'
      })
      .sort({ exchangeDate: -1 })
      .exec();
    return exchanges.map(doc => this.mapToEntity(doc));
  }

  async findByRewardId(rewardId: string): Promise<Exchange[]> {
    const exchanges = await this.exchangeModel
      .find({ rewardId })
      .populate({
        path: 'rewardId',
        select: 'imageUrl imagePath mediaType',
        model: 'Reward'
      })
      .sort({ exchangeDate: -1 })
      .exec();
    return exchanges.map(doc => this.mapToEntity(doc));
  }

  async countByRewardId(rewardId: string): Promise<number> {
    return await this.exchangeModel.countDocuments({ rewardId }).exec();
  }

  async update(id: string, exchange: Partial<Exchange>): Promise<Exchange | null> {
    const updatedExchange = await this.exchangeModel
      .findByIdAndUpdate(id, exchange, { new: true })
      .exec();
    return updatedExchange ? this.mapToEntity(updatedExchange) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.exchangeModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  private mapToEntity(doc: ExchangeDocument): Exchange {
    // Handle populated reward data
    const populatedReward = doc.rewardId as any;
    const rewardImageUrl = doc.rewardImageUrl || (populatedReward?.imageUrl);
    const rewardImagePath = doc.rewardImagePath || (populatedReward?.imagePath);
    const rewardMediaType = doc.rewardMediaType || (populatedReward?.mediaType);

    let rewardId: string;
    if (typeof doc.rewardId === 'string') {
      rewardId = doc.rewardId;
    } else if (doc.rewardId && typeof doc.rewardId === 'object' && (doc.rewardId as any)._id) {
      rewardId = (doc.rewardId as any)._id.toString();
    } else {
      rewardId = String(doc.rewardId) || '';
    }

    return {
      id: doc._id?.toString() || '',
      rewardId,
      rewardName: doc.rewardName,
      rewardImageUrl,
      rewardImagePath,
      rewardMediaType,
      clientId: doc.clientId,
      clientName: doc.clientName,
      clientEmail: doc.clientEmail,
      adminId: doc.adminId,
      adminName: doc.adminName,
      pointsUsed: doc.pointsUsed,
      exchangeDate: doc.exchangeDate,
      status: doc.status,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
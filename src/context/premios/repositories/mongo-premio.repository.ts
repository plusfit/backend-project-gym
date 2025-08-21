import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Premio, PremioFilters, PremioResponse } from '../entities/premio.entity';
import { Premio as PremioSchema, PremioDocument } from '../schemas/premio.schema';
import { PremioRepository } from './premio.repository';

@Injectable()
export class MongoPremioRepository extends PremioRepository {
  constructor(
    @InjectModel(PremioSchema.name)
    private readonly premioModel: Model<PremioDocument>,
  ) {
    super();
  }

  async create(premio: Partial<Premio>): Promise<Premio> {
    const createdPremio = new this.premioModel(premio);
    const savedPremio = await createdPremio.save();
    return this.mapToEntity(savedPremio);
  }

  async findAll(filters: PremioFilters): Promise<PremioResponse> {
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
      this.premioModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.premioModel.countDocuments(query).exec(),
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

  async findById(id: string): Promise<Premio | null> {
    const premio = await this.premioModel.findById(id).exec();
    return premio ? this.mapToEntity(premio) : null;
  }

  async findByName(name: string): Promise<Premio | null> {
    const premio = await this.premioModel.findOne({ name }).exec();
    return premio ? this.mapToEntity(premio) : null;
  }

  async findEnabled(): Promise<Premio[]> {
    const premios = await this.premioModel
      .find({ enabled: true })
      .sort({ createdAt: -1 })
      .exec();
    return premios.map(doc => this.mapToEntity(doc));
  }

  async update(id: string, premio: Partial<Premio>): Promise<Premio | null> {
    const updatedPremio = await this.premioModel
      .findByIdAndUpdate(id, premio, { new: true })
      .exec();
    return updatedPremio ? this.mapToEntity(updatedPremio) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.premioModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async incrementCanjes(id: string): Promise<void> {
    await this.premioModel
      .findByIdAndUpdate(id, { $inc: { totalCanjes: 1 } })
      .exec();
  }

  async toggleEnabled(id: string): Promise<Premio | null> {
    const premio = await this.premioModel.findById(id).exec();
    if (!premio) return null;

    premio.enabled = !premio.enabled;
    const updatedPremio = await premio.save();
    return this.mapToEntity(updatedPremio);
  }

  private mapToEntity(doc: PremioDocument): Premio {
    return {
      id: doc._id?.toString() || '',
      name: doc.name,
      description: doc.description,
      pointsRequired: doc.pointsRequired,
      enabled: doc.enabled,
      totalCanjes: doc.totalCanjes,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
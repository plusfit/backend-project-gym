import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Canje, CanjeFilters, CanjeResponse } from '../entities/canje.entity';
import { Canje as CanjeSchema, CanjeDocument } from '../schemas/canje.schema';
import { CanjeRepository } from './canje.repository';

@Injectable()
export class MongoCanjeRepository extends CanjeRepository {
  constructor(
    @InjectModel(CanjeSchema.name)
    private readonly canjeModel: Model<CanjeDocument>,
  ) {
    super();
  }

  async create(canje: Partial<Canje>): Promise<Canje> {
    const createdCanje = new this.canjeModel(canje);
    const savedCanje = await createdCanje.save();
    return this.mapToEntity(savedCanje);
  }

  async findAll(filters: CanjeFilters): Promise<CanjeResponse> {
    const { startDate, endDate, search, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.canjeDate = {};
      if (startDate) {
        query.canjeDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.canjeDate.$lte = new Date(endDate);
      }
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { premioName: { $regex: search, $options: 'i' } },
        { clienteName: { $regex: search, $options: 'i' } },
        { clienteEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const [data, totalCount] = await Promise.all([
      this.canjeModel
        .find(query)
        .sort({ canjeDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.canjeModel.countDocuments(query).exec(),
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

  async findById(id: string): Promise<Canje | null> {
    const canje = await this.canjeModel.findById(id).exec();
    return canje ? this.mapToEntity(canje) : null;
  }

  async findByClienteId(clienteId: string): Promise<Canje[]> {
    const canjes = await this.canjeModel
      .find({ clienteId })
      .sort({ canjeDate: -1 })
      .exec();
    return canjes.map(doc => this.mapToEntity(doc));
  }

  async findByPremioId(premioId: string): Promise<Canje[]> {
    const canjes = await this.canjeModel
      .find({ premioId })
      .sort({ canjeDate: -1 })
      .exec();
    return canjes.map(doc => this.mapToEntity(doc));
  }

  async countByPremioId(premioId: string): Promise<number> {
    return await this.canjeModel.countDocuments({ premioId }).exec();
  }

  async update(id: string, canje: Partial<Canje>): Promise<Canje | null> {
    const updatedCanje = await this.canjeModel
      .findByIdAndUpdate(id, canje, { new: true })
      .exec();
    return updatedCanje ? this.mapToEntity(updatedCanje) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.canjeModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  private mapToEntity(doc: CanjeDocument): Canje {
    return {
      id: doc._id?.toString() || '',
      premioId: doc.premioId,
      premioName: doc.premioName,
      clienteId: doc.clienteId,
      clienteName: doc.clienteName,
      clienteEmail: doc.clienteEmail,
      adminId: doc.adminId,
      adminName: doc.adminName,
      pointsUsed: doc.pointsUsed,
      canjeDate: doc.canjeDate,
      status: doc.status,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
import { Injectable } from "@nestjs/common";
import { Model, Document, FilterQuery, Types } from "mongoose";
import { TenantContextService } from "../services/tenant-context.service";

@Injectable()
export abstract class TenantBaseRepository<T extends Document> {
  constructor(
    protected readonly model: Model<T>,
    protected readonly tenantContext: TenantContextService,
  ) {}

  protected addTenantFilter<K>(filter: FilterQuery<K> = {}): FilterQuery<K> {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    } as FilterQuery<K>;
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(this.addTenantFilter(filter)).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findOne(this.addTenantFilter({ _id: id })).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(this.addTenantFilter(filter)).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const tenantData = {
      ...data,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    return this.model.create(tenantData);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(this.addTenantFilter({ _id: id }), data, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model
      .deleteOne(this.addTenantFilter({ _id: id }))
      .exec();
    return result.deletedCount > 0;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(this.addTenantFilter(filter)).exec();
  }

  async paginate(
    filter: FilterQuery<T> = {},
    page = 1,
    limit = 10,
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const tenantFilter = this.addTenantFilter(filter);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(tenantFilter).skip(skip).limit(limit).exec(),
      this.model.countDocuments(tenantFilter).exec(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreatePlanDto } from "../dto/create-plan.dto";
import { UpdatePlanDto } from "../dto/update-plan.dto";
import { Plan, PlanDocument } from "../schemas/plan.schema";
import { PlanRepository } from "./plans.repository";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";

export class MongoPlansRepository implements PlanRepository {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async createPlan(plan: CreatePlanDto): Promise<Plan> {
    const tenantData = {
      ...plan,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    return await this.planModel.create(tenantData);
  }

  async getPlans(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string } = {},
  ): Promise<Plan[]> {
    const filter: any = {};
    if (filters.name) {
      filter.name = { $regex: filters.name, $options: "i" };
    }
    if (filters.type) {
      filter.type = filters.type;
    }

    return await this.planModel
      .find(this.addTenantFilter(filter))
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countPlans(filters: any = {}): Promise<number> {
    const filter: any = {};
    if (filters.name) {
      filter.name = { $regex: filters.name, $options: "i" };
    }
    if (filters.type) {
      filter.type = filters.type;
    }
    return await this.planModel
      .countDocuments(this.addTenantFilter(filter))
      .exec();
  }

  async findOne(id: string): Promise<Plan | null> {
    return await this.planModel
      .findOne(this.addTenantFilter({ _id: id }))
      .populate("defaultRoutine")
      .exec();
  }

  async update(id: string, plan: UpdatePlanDto): Promise<Plan | null> {
    try {
      return await this.planModel
        .findOneAndUpdate(this.addTenantFilter({ _id: id }), plan, {
          new: true,
        })
        .exec();
    } catch (error: any) {
      throw new Error(`Error updating plan with id ${id}, ${error.message}`);
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      const result = await this.planModel
        .deleteOne(this.addTenantFilter({ _id: id }))
        .exec();
      return result.deletedCount > 0;
    } catch (error: any) {
      throw new Error(`Error deleting plan with id ${id}, ${error.message}`);
    }
  }

  async getPlanByMode(mode: string): Promise<Plan | null> {
    return await this.planModel.findOne(this.addTenantFilter({ mode })).exec();
  }

  async getClientsWithPlansAndSchedules(offset: number, limit: number) {
    return await this.planModel
      .find(this.addTenantFilter())
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async findAssignableClientsBasedOnPlan(planId: string) {
    return await this.planModel
      .find(this.addTenantFilter({ _id: planId }))
      .exec();
  }
}

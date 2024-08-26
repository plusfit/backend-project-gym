import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreatePlanDto } from "../dto/create-plan.dto";
import { Plan } from "../schemas/plans.schemas";
import { PlanRepository } from "./plans.repository";

export class MongoPlansRepository implements PlanRepository {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
  ) {}

  async createPlan(plan: CreatePlanDto): Promise<Plan> {
    return await this.planModel.create(plan);
  }

  async getPlans(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string } = {},
  ): Promise<Plan[]> {
    return await this.planModel.find(filters).skip(offset).limit(limit).exec();
  }

  async countPlans(filters: any = {}): Promise<number> {
    return await this.planModel.countDocuments(filters).exec();
  }
}

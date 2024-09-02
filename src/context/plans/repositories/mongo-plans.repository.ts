import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreatePlanDto } from "../dto/create-plan.dto";
import { UpdatePlanDto } from "../dto/update-plan.dto";
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

  async findOne(id: string): Promise<Plan | null> {
    return await this.planModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<Plan[]> {
    return await this.planModel.find({ userId }).exec();
  }

  async update(id: string, plan: UpdatePlanDto): Promise<Plan | null> {
    try {
      return await this.planModel
        .findByIdAndUpdate(id, plan, { new: true })
        .exec();
    } catch (error: any) {
      throw new Error(`Error updating plan with id ${id}, ${error.message}`);
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.planModel.findByIdAndDelete(id).exec();
      return true;
    } catch (error: any) {
      throw new Error(`Error deleting plan with id ${id}, ${error.message}`);
    }
  }
}

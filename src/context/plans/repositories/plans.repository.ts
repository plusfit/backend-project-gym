import { CreatePlanDto } from "../dto/create-plan.dto";
import { UpdatePlanDto } from "../dto/update-plan.dto";
import { PlanEntity } from "../entities/plan.entity";

export const PLAN_REPOSITORY = "PlanRepository";

export interface PlanRepository {
  createPlan(plan: CreatePlanDto): Promise<PlanEntity>;
  getPlans(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string },
  ): Promise<PlanEntity[]>;
  countPlans(filters: { name?: string; type?: string }): Promise<number>;
  findOne(id: string): Promise<PlanEntity | null>;
  findByUserId(userId: string): Promise<PlanEntity[]>;
  update(id: string, plan: UpdatePlanDto): Promise<PlanEntity | null>;
  remove(id: string): Promise<boolean>;
}

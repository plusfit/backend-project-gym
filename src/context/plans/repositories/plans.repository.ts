import { CreatePlanDto } from "../dto/create-plan.dto";
import { Plan } from "../entities/plan.entity";

export const PLAN_REPOSITORY = "PlanRepository";

export interface PlanRepository {
  createPlan(plan: CreatePlanDto): Promise<Plan>;
  getPlans(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string },
  ): Promise<Plan[]>;
  countPlans(filters: { name?: string; type?: string }): Promise<number>;
  findOne(id: string): Promise<Plan>;
  update(id: string, plan: CreatePlanDto): Promise<Plan>;
  remove(id: string): Promise<boolean>;
}

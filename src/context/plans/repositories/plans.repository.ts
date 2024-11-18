import { Plan } from "@/src/context/plans/schemas/plan.schema";

import { CreatePlanDto } from "../dto/create-plan.dto";
import { UpdatePlanDto } from "../dto/update-plan.dto";

export const PLAN_REPOSITORY = "PlanRepository";

export interface PlanRepository {
  createPlan(plan: CreatePlanDto): Promise<Plan>;
  getPlans(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string },
  ): Promise<Plan[]>;
  countPlans(filters: { name?: string; type?: string }): Promise<number>;
  findOne(id: string): Promise<Plan | null>;
  update(id: string, plan: UpdatePlanDto): Promise<Plan | null>;
  remove(id: string): Promise<boolean>;
}

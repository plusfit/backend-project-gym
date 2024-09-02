import { Inject, Injectable } from "@nestjs/common";

import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { Plan } from "./entities/plan.entity";
import { PLAN_REPOSITORY } from "./repositories/plans.repository";

@Injectable()
export class PlansService {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly plansRepository: any,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    return await this.plansRepository.createPlan(createPlanDto);
  }

  async getPlans(page: number, limit: number, name?: string, type?: string) {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (type) {
      filters.type = type;
    }

    const [data, total] = await Promise.all([
      this.plansRepository.getPlans(offset, limit, filters),
      this.plansRepository.countPlans(filters),
    ]);
    return { data, total, page, limit };
  }

  findByUserId(userId: string) {
    return this.plansRepository.findByUserId(userId);
  }

  findOne(id: string) {
    return this.plansRepository.findOne(id);
  }

  update(id: string, updatePlanDto: UpdatePlanDto) {
    return this.plansRepository.update(id, updatePlanDto);
  }

  remove(id: string) {
    return this.plansRepository.remove(id);
  }
}

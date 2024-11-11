import { Inject, Injectable } from "@nestjs/common";

import { PlanEntity } from "@/src/context/plans/entities/plan.entity";

import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PLAN_REPOSITORY } from "./repositories/plans.repository";
import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";

@Injectable()
export class PlansService {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly plansRepository: any,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: any,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<PlanEntity> {
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

  assignPlanToClient(clientId: string, planId: string) {
    return this.clientRepository.assignPlanToClient(clientId, planId);
  }
}

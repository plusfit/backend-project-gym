import { Injectable } from "@nestjs/common";

import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";

@Injectable()
export class PlansService {
  create(createPlanDto: CreatePlanDto) {
    return createPlanDto;
  }

  findAll() {
    return `This action returns all plans`;
  }

  findOne(id: number) {
    return `This action returns a #${id} plan`;
  }

  update(id: number, updatePlanDto: UpdatePlanDto) {
    return updatePlanDto;
  }

  remove(id: number) {
    return `This action removes a #${id} plan`;
  }
}

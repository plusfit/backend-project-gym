import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiResponse } from "@nestjs/swagger";

import { PageDto } from "../shared/dtos/page.dto";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { FiltersDto } from "./dto/filters.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PlansService } from "./plans.service";

@Controller("plans")
export class PlansController {
  logger = new Logger(PlansService.name);
  constructor(private readonly plansService: PlansService) {}

  @ApiResponse({ status: 201, description: "Plan created" })
  @ApiBody({
    description: "El plan",
    type: [CreatePlanDto],
  })
  @Post("create")
  create(@Body() createPlanDto: CreatePlanDto) {
    this.logger.log("Creating a new Plan");
    return this.plansService.create(createPlanDto);
  }

  @Get()
  getPlans(@Query() pageDto: PageDto, @Query() filtersDto: FiltersDto) {
    this.logger.log("Getting plans");
    return this.plansService.getPlans(
      pageDto.page,
      pageDto.limit,
      filtersDto.name,
      filtersDto.plansType,
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    try {
      const plan = await this.plansService.findOne(id);
      if (!plan) {
        throw new NotFoundException(`Plan with id ${id} not found`);
      }
      return plan;
    } catch (error: any) {
      this.logger.error(error.message);
      throw new NotFoundException(error.message);
    }
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.plansService.remove(id);
  }
}

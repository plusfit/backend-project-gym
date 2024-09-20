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
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import { PageDto } from "../shared/dtos/page.dto";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { FiltersDto } from "./dto/filters.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PlansService } from "./plans.service";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { Role } from "@/src/context/shared/constants/roles.constant";

@ApiTags("plans")
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
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  create(@Body() createPlanDto: CreatePlanDto) {
    this.logger.log("Creating a new Plan");
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
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
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
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

  @Get("user/:userId")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  findByUserId(@Param("userId") userId: string) {
    return this.plansService.findByUserId(userId);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  update(@Param("id") id: string, @Body() updatePlanDto: UpdatePlanDto) {
    try {
      const plan = this.plansService.update(id, updatePlanDto);
      if (!plan) {
        throw new NotFoundException(`Plan with id ${id} not found`);
      }
      return plan;
    } catch (error: any) {
      this.logger.error(error.message);
      throw new NotFoundException(error.message);
    }
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.plansService.remove(id);
  }
}

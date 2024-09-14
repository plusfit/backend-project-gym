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
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";

import { GetPlansDto } from "@/src/context/plans/dto/get-plans.dto";

import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PlansService } from "./plans.service";

@ApiTags("plans")
@Controller("plans")
export class PlansController {
  private readonly logger = new Logger(PlansController.name);

  constructor(private readonly plansService: PlansService) {}

  @ApiResponse({ status: 201, description: "Plan created successfully." })
  @ApiResponse({ status: 400, description: "Invalid input, plan not created." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @ApiBody({
    description: "The plan data to create.",
    type: [CreatePlanDto],
  })
  @Post("create")
  async create(@Body() createPlanDto: CreatePlanDto) {
    this.logger.log(
      "Creating a new Plan with data:",
      JSON.stringify(createPlanDto),
    );
    const plan = await this.plansService.create(createPlanDto);
    this.logger.log(`Plan created successfully with ID: ${plan._id}`);
    return {
      message: "Plan created successfully.",
      plan,
    };
  }

  @ApiResponse({
    status: 200,
    description: "List of plans retrieved successfully.",
  })
  @ApiResponse({ status: 400, description: "Invalid input parameters." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @Get()
  async getPlans(@Query() getPlansDto: GetPlansDto) {
    this.logger.log(
      `Retrieved plans with data: ${JSON.stringify(getPlansDto)}`,
    );
    const response = await this.plansService.getPlans(
      getPlansDto.page,
      getPlansDto.limit,
      getPlansDto.name,
      getPlansDto.plansType,
    );
    this.logger.log(`Retrieved ${response.data.length} plans.`);
    return response;
  }

  @ApiResponse({ status: 200, description: "Plan found." })
  @ApiResponse({ status: 404, description: "Plan not found." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @Get(":id")
  async findOne(@Param("id") id: string) {
    this.logger.log(`Finding plan with ID: ${id}`);
    const plan = await this.plansService.findOne(id);
    if (!plan) {
      this.logger.warn(`Plan with ID: ${id} not found.`);
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    this.logger.log(`Plan with ID: ${id} found.`);
    return plan;
  }

  @ApiResponse({ status: 200, description: "Plans found for the user." })
  @ApiResponse({ status: 404, description: "No plans found for the user." })
  @Get("user/:userId")
  async findByUserId(@Param("userId") userId: string) {
    this.logger.log(`Finding plans for user ID: ${userId}`);
    const plans = await this.plansService.findByUserId(userId);
    if (plans.length === 0) {
      this.logger.warn(`No plans found for user ID: ${userId}`);
      throw new NotFoundException(`No plans found for user ID ${userId}`);
    }
    this.logger.log(`Found ${plans.length} plans for user ID: ${userId}`);
    return plans;
  }

  @ApiResponse({ status: 200, description: "Plan updated successfully." })
  @ApiResponse({ status: 404, description: "Plan not found." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @Patch(":id")
  async update(@Param("id") id: string, @Body() updatePlanDto: UpdatePlanDto) {
    this.logger.log(`Updating plan with ID: ${id}`);
    const plan = await this.plansService.update(id, updatePlanDto);
    if (!plan) {
      this.logger.warn(`Plan with ID: ${id} not found for update.`);
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    this.logger.log(`Plan with ID: ${id} updated successfully.`);
    return {
      message: "Plan updated successfully.",
      plan,
    };
  }

  @ApiResponse({ status: 200, description: "Plan deleted successfully." })
  @ApiResponse({ status: 404, description: "Plan not found." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @Delete(":id")
  async remove(@Param("id") id: string) {
    this.logger.log(`Removing plan with ID: ${id}`);
    const result = await this.plansService.remove(id);
    if (!result) {
      this.logger.warn(`Plan with ID: ${id} not found for deletion.`);
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    this.logger.log(`Plan with ID: ${id} removed successfully.`);
    return {
      message: "Plan deleted successfully.",
    };
  }
}

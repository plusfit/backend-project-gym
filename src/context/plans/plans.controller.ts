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

import { ClientsService } from "@/src/context/clients/clients.service";
import { GetPlansDto } from "@/src/context/plans/dto/get-plans.dto";
import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { CreatePlanDto } from "./dto/create-plan.dto";
import { GetClientsAssignalDto } from "./dto/get-clients-assignal.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PlansService } from "./plans.service";

@ApiTags("plans")
@Controller("plans")
export class PlansController {
  private readonly logger = new Logger(PlansController.name);

  constructor(
    private readonly plansService: PlansService,
    private readonly clientService: ClientsService,
  ) {}

  @ApiResponse({ status: 201, description: "Plan created successfully." })
  @ApiResponse({ status: 400, description: "Invalid input, plan not created." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @ApiBody({
    description: "The plan data to create.",
    type: CreatePlanDto,
  })
  @Post("create")
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  create(@Body() createPlanDto: CreatePlanDto) {
    this.logger.log("Creating a new Plan");
    return this.plansService.create(createPlanDto);
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

  @Get("assignableClients")
  // @Roles(Role.Admin, Role.Client)
  // @UseGuards(RolesGuard)
  findAssignableClientsBasedOnPlan(
    @Query() getClientsAssignalDto: GetClientsAssignalDto,
  ) {
    return this.plansService.findAssignableClientsBasedOnPlan(
      getClientsAssignalDto.page,
      getClientsAssignalDto.limit,
      getClientsAssignalDto.email,
    );
  }

  @ApiResponse({ status: 200, description: "Plan found." })
  @ApiResponse({ status: 404, description: "Plan not found." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @Get(":id")
  // @Roles(Role.Admin, Role.Client)
  // @UseGuards(RolesGuard)
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
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  findByUserId(@Param("userId") userId: string) {
    return this.plansService.findByUserId(userId);
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
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.plansService.remove(id);
  }

  //Asign plan to user
  //When the plan is assigned to a user the plan default routine is assigned to.
  @Post("assign/:planId/:userId")
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  async assignPlanToUser(
    @Param("planId") planId: string,
    @Param("userId") userId: string,
  ) {
    try {
      // Validate if plan exists
      const planExist = await this.plansService.findOne(planId);
      if (!planExist) {
        throw new NotFoundException(`Plan with ID ${planId} not found`);
      }

      // Validate if clients exists
      const clientExist = await this.clientService.findOne(userId);
      if (!clientExist) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if clients have a routineId assigned
      if (!clientExist.routineId) {
        // Assign the defaultRoutine from the plan to the client
        await this.clientService.update(userId, {
          routineId: planExist.defaultRoutine,
        });
      }

      // Assign the plan to the client
      await this.plansService.assignPlanToClient(userId, planId);

      return {
        message: "Plan assigned to user successfully.",
      };
    } catch (error: any) {
      this.logger.error(`Failed to assign plan to user: ${error.message}`);
      throw error;
    }
  }
}

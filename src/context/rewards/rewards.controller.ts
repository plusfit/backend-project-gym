import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { RewardsService } from "./rewards.service";
import { CreateRewardDto } from "./dto/create-reward.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";
import { GetRewardsDto } from "./dto/get-rewards.dto";

@ApiTags("rewards")
@Controller("rewards")
@Roles(Role.Admin)
@UseGuards(RolesGuard)
export class RewardsController {
	constructor(private readonly rewardsService: RewardsService) {}

	@Post()
	@ApiOperation({ summary: "Create a new reward" })
	@ApiResponse({ status: 201, description: "Reward created successfully" })
	@ApiResponse({ status: 409, description: "Reward with same required days already exists" })
	async create(@Body() createRewardDto: CreateRewardDto) {
		return this.rewardsService.create(createRewardDto);
	}

	@Get()
	@ApiOperation({ summary: "Get all rewards with pagination and filters" })
	@ApiResponse({ status: 200, description: "Paginated rewards list" })
	async findAll(@Query() queryDto: GetRewardsDto) {
		return this.rewardsService.findAll(queryDto);
	}

	@Get("active")
	@ApiOperation({ summary: "Get all active rewards" })
	@ApiResponse({ status: 200, description: "List of active rewards" })
	async findActiveRewards() {
		return this.rewardsService.findActiveRewards();
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a specific reward by ID" })
	@ApiResponse({ status: 200, description: "Reward found" })
	@ApiResponse({ status: 404, description: "Reward not found" })
	async findOne(@Param("id") id: string) {
		return this.rewardsService.findOne(id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update a reward" })
	@ApiResponse({ status: 200, description: "Reward updated successfully" })
	@ApiResponse({ status: 404, description: "Reward not found" })
	@ApiResponse({ status: 409, description: "Reward with same required days already exists" })
	async update(@Param("id") id: string, @Body() updateRewardDto: UpdateRewardDto) {
		return this.rewardsService.update(id, updateRewardDto);
	}

	@Patch(":id/toggle-active")
	@ApiOperation({ summary: "Toggle reward active status" })
	@ApiResponse({ status: 200, description: "Reward status toggled successfully" })
	@ApiResponse({ status: 404, description: "Reward not found" })
	async toggleActive(@Param("id") id: string) {
		return this.rewardsService.toggleActive(id);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a reward" })
	@ApiResponse({ status: 200, description: "Reward deleted successfully" })
	@ApiResponse({ status: 404, description: "Reward not found" })
	async remove(@Param("id") id: string) {
		await this.rewardsService.remove(id);
		return { message: "Recompensa eliminada exitosamente" };
	}
}
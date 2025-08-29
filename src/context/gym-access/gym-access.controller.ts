import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { GymAccessService } from "./gym-access.service";
import { ValidateAccessDto } from "./dto/validate-access.dto";
import { GetGymAccessHistoryDto } from "./dto/get-gym-access-history.dto";

@ApiTags("gym-access")
@Controller("gym-access")
export class GymAccessController {
	constructor(private readonly gymAccessService: GymAccessService) {}

	@Post("validate")
	@ApiOperation({ summary: "Validate client access to gym" })
	@ApiResponse({ status: 200, description: "Access validation result" })
	async validateAccess(@Body() validateAccessDto: ValidateAccessDto) {
		console.log("=== GYM ACCESS CONTROLLER - VALIDATE ENDPOINT CALLED ===");
		console.log("Request body:", validateAccessDto);
		try {
			return await this.gymAccessService.validateAccess(validateAccessDto);
		} catch (error: any) {
			// Handle legacy error format if still thrown
			if (error.data) {
				return error.data;
			}
			return {
				message: error.message || "Error al validar el acceso",
				client: undefined,
			};
		}
	}

	@Get("history")
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	@ApiOperation({ summary: "Get gym access history with pagination and filters" })
	@ApiResponse({ status: 200, description: "Paginated gym access history" })
	async getHistory(@Query() queryDto: GetGymAccessHistoryDto) {
		return this.gymAccessService.getHistory(queryDto);
	}

	@Get("stats")
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	@ApiOperation({ summary: "Get gym access statistics with optional filters" })
	@ApiResponse({ status: 200, description: "Access statistics (filtered or daily by default)" })
	async getStats(@Query() queryDto: GetGymAccessHistoryDto) {
		return this.gymAccessService.getStats(queryDto);
	}

	@Get("client/:cedula/history")
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	@ApiOperation({ summary: "Get specific client access history" })
	@ApiResponse({ status: 200, description: "Client-specific access history" })
	async getClientHistory(
		@Param("cedula") cedula: string,
		@Query("page") page?: number,
		@Query("limit") limit?: number,
	) {
		return this.gymAccessService.getClientHistory(cedula, page, limit);
	}
}
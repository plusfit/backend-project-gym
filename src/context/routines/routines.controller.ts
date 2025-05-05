import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Logger,
	NotFoundException,
	Param,
	Post,
	Put,
	Query,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import {
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";

import { ClientsService } from "@/src/context/clients/clients.service";
import { CreateSubRoutineDto } from "@/src/context/routines/dto/create-sub-routine.dto";
import { GetRoutinesDto } from "@/src/context/routines/dto/get-routines.dto";
import { UpdateRoutineDto } from "@/src/context/routines/dto/update-routine.dto";
import { UpdateSubRoutineDto } from "@/src/context/routines/dto/update-sub-routine.dto";
import { RoutinesService } from "@/src/context/routines/services/routines.service";
import { SubRoutinesService } from "@/src/context/routines/services/sub-routines.service";
// import { Role } from "@/src/context/shared/constants/roles.constant";
// import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
// import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { validateMongoId } from "@/src/context/shared/utils/validateMongoId.validator";

import { CreateRoutineDto } from "./dto/create-routine.dto";

@ApiTags("routines")
@Controller("routines")
export class RoutinesController {
	private readonly logger = new Logger(RoutinesController.name);

	constructor(
		private readonly subRoutinesService: SubRoutinesService,
		private readonly routinesService: RoutinesService,
		private readonly clientService: ClientsService,
	) {}

	@Post()
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Crear una nueva rutina" })
	@ApiResponse({ status: 201, description: "Rutina creada exitosamente." })
	@ApiResponse({ status: 400, description: "Datos inválidos." })
	@ApiBody({ type: CreateRoutineDto })
	async createRoutine(@Body() createRoutineDto: CreateRoutineDto) {
		this.logger.log("Creating a new routine with data:", createRoutineDto);
		try {
			const routine =
				await this.routinesService.createRoutine(createRoutineDto);
			this.logger.log(
				`Routine created successfully with ID: ${routine._id as string}`,
			);
			return routine;
		} catch (error) {
			this.logger.error("Failed to create routine:", error);
			throw error;
		}
	}

	@Delete(":id")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Eliminar una rutina por ID" })
	@ApiResponse({ status: 200, description: "Rutina eliminada exitosamente." })
	@ApiResponse({ status: 404, description: "Rutina no encontrada." })
	@ApiParam({ name: "id", type: String, description: "ID de la rutina" })
	@UsePipes(new ValidationPipe({ transform: true }))
	async delete(@Param("id") id: string) {
		this.logger.log(`Attempting to delete routine with ID: ${id}`);
		if (validateMongoId(id)) {
			const result = await this.routinesService.deleteRoutine(id);
			if (!result) {
				this.logger.warn(`Routine with ID: ${id} not found for deletion.`);
				throw new NotFoundException(`Routine with ID ${id} not found`);
			}
			this.logger.log(`Routine with ID: ${id} deleted successfully.`);
			return { message: "Routine deleted successfully." };
		}
			throw new BadRequestException(`${id} is not a valid MongoDB ID`);
	}

	@Get("")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({
		summary: "Obtener todas las rutinas con paginación y filtros",
	})
	@ApiResponse({ status: 200, description: "Lista de rutinas." })
	@ApiResponse({
		status: 400,
		description: "Parámetros de consulta inválidos.",
	})
	@ApiQuery({
		name: "page",
		required: false,
		type: Number,
		description: "Número de página",
	})
	@ApiQuery({
		name: "limit",
		required: false,
		type: Number,
		description: "Cantidad de rutinas por página",
	})
	@ApiQuery({
		name: "name",
		required: false,
		type: String,
		description: "Filtro por nombre de la rutina",
	})
	@ApiQuery({
		name: "type",
		required: false,
		type: String,
		description: "Filtro por tipo de rutina",
	})
	async findAllRoutines(@Query() getRoutinesDto: GetRoutinesDto) {
		this.logger.log("Retrieving routines with filters:", getRoutinesDto);
		try {
			const routines = await this.routinesService.getRoutines(
				getRoutinesDto.page,
				getRoutinesDto.limit,
				getRoutinesDto.name,
				getRoutinesDto.type,
				getRoutinesDto.mode,
				getRoutinesDto.isGeneral,
			);
			this.logger.log(`Retrieved ${routines.data.length} routines.`);
			return routines;
		} catch (error) {
			this.logger.error("Failed to retrieve routines:", error);
			throw error;
		}
	}

	@Get(":id")
	// @Roles(Role.Admin, Role.Client)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Obtener una rutina por ID" })
	@ApiResponse({ status: 200, description: "Rutina encontrada." })
	@ApiResponse({ status: 404, description: "Rutina no encontrada." })
	@ApiParam({
		name: "id",
		type: String,
		description: "ID de la rutina",
	})
	async findOneRoutine(@Param("id") id: string) {
		this.logger.log(`Searching for routine with ID: ${id}`);
		const routine = await this.routinesService.getRoutineById(id);
		if (!routine) {
			this.logger.warn(`Routine with ID: ${id} not found.`);
			throw new NotFoundException(`Routine with ID ${id} not found`);
		}
		this.logger.log(`Routine with ID: ${id} found.`);
		return routine;
	}

	@Put(":id")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Actualizar una rutina por ID" })
	@ApiResponse({ status: 200, description: "Rutina actualizada exitosamente." })
	@ApiResponse({ status: 404, description: "Rutina no encontrada." })
	@ApiParam({ name: "id", type: String, description: "ID de la rutina" })
	@ApiQuery({
		name: "clientId",
		required: false,
		type: String,
		description: "ID del cliente para actualizar rutina",
	})
	@ApiBody({ type: UpdateRoutineDto })
	async update(
		@Param("id") id: string,
		@Body() updateRoutineDto: UpdateRoutineDto,
		@Query("clientId") clientId?: string,
	) {
		this.logger.log(`Updating routine with ID: ${id}`);
		try {
			const updatedRoutine = await this.routinesService.updateRoutine(
				id,
				updateRoutineDto,
				clientId,
			);
			if (!updatedRoutine) {
				this.logger.warn(`Routine with ID: ${id} not found for update.`);
				throw new NotFoundException(`Routine with ID ${id} not found`);
			}
			this.logger.log(`Routine with ID: ${id} updated successfully.`);
			return { message: "Routine updated successfully.", updatedRoutine };
		} catch (error) {
			this.logger.error(`Failed to update routine with ID ${id}:`, error);
			throw error;
		}
	}

	//assing routine to a client
	@Post("assign/:id")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Asignar una rutina a un cliente" })
	@ApiResponse({ status: 200, description: "Rutina asignada exitosamente." })
	@ApiResponse({ status: 404, description: "Rutina no encontrada." })
	@ApiParam({ name: "id", type: String, description: "ID de la rutina" })
	@ApiQuery({
		name: "clientId",
		required: true,
		type: String,
		description: "ID del cliente para asignar rutina",
	})
	async assignRoutineToClient(
		@Param("id") id: string,
		@Query("clientId") clientId: string,
	) {
		this.logger.log(
			`Assigning routine with ID: ${id} to client with ID: ${clientId}`,
		);
		try {
			const assignedRoutine = await this.clientService.assignRoutineToClient(
				clientId,
				id,
			);
			if (!assignedRoutine) {
				this.logger.warn(`Routine with ID: ${id} not found for assignment.`);
				throw new NotFoundException(`Routine with ID ${id} not found`);
			}
			this.logger.log(
				`Routine with ID: ${id} assigned to client with ID: ${clientId} successfully.`,
			);
			return { message: "Routine assigned successfully.", assignedRoutine };
		} catch (error) {
			this.logger.error(
				`Failed to assign routine with ID ${id} to client with ID ${clientId}:`,
				error,
			);
			throw error;
		}
	}

	@Post("subRoutine")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Crear una nueva sub-rutina" })
	@ApiResponse({ status: 201, description: "Sub-rutina creada exitosamente." })
	@ApiResponse({ status: 400, description: "Datos inválidos." })
	@ApiBody({ type: CreateSubRoutineDto })
	async createSubRoutine(@Body() createSubRoutineDto: CreateSubRoutineDto) {
		this.logger.log("Creating a new routine with data:", createSubRoutineDto);
		try {
			const subRoutine =
				await this.subRoutinesService.createSubRoutine(createSubRoutineDto);
			this.logger.log(
				`Routine created successfully with ID: ${subRoutine._id}`,
			);
			return subRoutine;
		} catch (error) {
			this.logger.error("Failed to create routine:", error);
			throw error;
		}
	}

	@Delete("subRoutine/:id")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Eliminar una rutina por ID" })
	@ApiResponse({ status: 200, description: "Rutina eliminada exitosamente." })
	@ApiResponse({ status: 404, description: "Rutina no encontrada." })
	@ApiParam({ name: "id", type: String, description: "ID de la rutina" })
	@UsePipes(new ValidationPipe({ transform: true }))
	async deleteSubRoutine(@Param("id") id: string) {
		this.logger.log(`Attempting to delete routine with ID: ${id}`);
		if (validateMongoId(id)) {
			const result = await this.subRoutinesService.deleteSubRoutine(id);
			if (!result) {
				this.logger.warn(`Subroutine with ID: ${id} not found for deletion.`);
				throw new NotFoundException(`Subroutine with ID ${id} not found`);
			}
			this.logger.log(`Subroutine with ID: ${id} deleted successfully.`);
			return result;
		} else {
			throw new BadRequestException(`${id} is not a valid MongoDB ID`);
		}
	}

	@Get("subRoutine")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({
		summary: "Obtener todas las rutinas con paginación y filtros",
	})
	@ApiResponse({ status: 200, description: "Lista de rutinas." })
	@ApiResponse({
		status: 400,
		description: "Parámetros de consulta inválidos.",
	})
	@ApiQuery({
		name: "page",
		required: false,
		type: Number,
		description: "Número de página",
	})
	@ApiQuery({
		name: "limit",
		required: false,
		type: Number,
		description: "Cantidad de rutinas por página",
	})
	@ApiQuery({
		name: "name",
		required: false,
		type: String,
		description: "Filtro por nombre de la rutina",
	})
	@ApiQuery({
		name: "type",
		required: false,
		type: String,
		description: "Filtro por tipo de rutina",
	})
	@ApiQuery({
		name: "mode",
		required: false,
		type: String,
		description: "Filtro por modo de rutina",
	})
	async findAllSubRoutines(@Query() getRoutinesDto: GetRoutinesDto) {
		this.logger.log("Retrieving routines with filters:", getRoutinesDto);
		try {
			const routines = await this.subRoutinesService.getSubRoutines(
				getRoutinesDto.page,
				getRoutinesDto.limit,
				getRoutinesDto.name,
				getRoutinesDto.type,
			);
			this.logger.log(`Retrieved ${routines.data.length} routines.`);
			return routines;
		} catch (error) {
			this.logger.error("Failed to retrieve routines:", error);
			throw error;
		}
	}

	@Get("subRoutine/:id")
	// @Roles(Role.Admin, Role.Client)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Obtener una rutina por ID" })
	@ApiResponse({ status: 200, description: "Rutina encontrada." })
	@ApiResponse({ status: 404, description: "Rutina no encontrada." })
	@ApiParam({ name: "id", type: String, description: "ID de la rutina" })
	async findOneSubRoutine(@Param("id") id: string) {
		this.logger.log(`Searching for sub-routine with ID: ${id}`);
		const routine = await this.subRoutinesService.getSubRoutineById(id);
		if (!routine) {
			this.logger.warn(`Sub-Routine with ID: ${id} not found.`);
			throw new NotFoundException(`Sub-Routine with ID ${id} not found`);
		}
		this.logger.log(`Sub-Routine with ID: ${id} found.`);
		return routine;
	}

	@Put("subRoutine/:id")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Actualizar una rutina por ID" })
	@ApiResponse({ status: 200, description: "Rutina actualizada exitosamente." })
	@ApiResponse({ status: 404, description: "Rutina no encontrada." })
	@ApiParam({ name: "id", type: String, description: "ID de la rutina" })
	@ApiQuery({
		name: "clientId",
		required: false,
		type: String,
		description: "ID del cliente para actualizar rutina",
	})
	@ApiBody({ type: UpdateSubRoutineDto })
	async updateSubRoutine(
		@Param("id") id: string,
		@Body() updateSubRoutineDto: UpdateSubRoutineDto,
		@Query("clientId") clientId?: string,
	) {
		this.logger.log(`Updating subroutine with ID: ${id}`);
		try {
			const updatedRoutine = await this.subRoutinesService.updateSubRoutine(
				id,
				updateSubRoutineDto,
				clientId,
			);
			if (!updatedRoutine) {
				this.logger.warn(`Subroutine with ID: ${id} not found for update.`);
				throw new NotFoundException(`Routine with ID ${id} not found`);
			}
			this.logger.log(`Subroutine with ID: ${id} updated successfully.`);
			return { message: "Subroutine updated successfully.", updatedRoutine };
		} catch (error) {
			this.logger.error(`Failed to update Subroutine with ID ${id}:`, error);
			throw error;
		}
	}

	@Delete("exercise/:id")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	deleteExercise(@Param("id") id: string) {
		return this.subRoutinesService.deleteExercise(id);
	}

	@Get("routinesBySubroutine/:id")
	// @Roles(Role.Admin)
	// @UseGuards(RolesGuard)
	@ApiOperation({ summary: "Obtener listado de rutinas por ID de Subrutina." })
	@ApiResponse({ status: 200, description: "Lista de rutinas." })
	@ApiResponse({ status: 404, description: "Subrutina no encontrada." })
	@ApiParam({ name: "id", type: String, description: "ID de la subrutina" })
	async getRoutinesBySubRoutine(@Param("id") id: string) {
		this.logger.log(`Searching for routines with subRoutine ID: ${id}`);
		const routines = await this.routinesService.getRoutinesBySubRoutine(id);
		if (!routines) {
			this.logger.warn(`No routines found for subRoutine with ID: ${id}`);
			throw new NotFoundException(
				`No routines found for subRoutine with ID ${id}`,
			);
		}
		this.logger.log(
			`Found ${routines.length} routines for subRoutine with ID: ${id}`,
		);
		return routines;
	}
}

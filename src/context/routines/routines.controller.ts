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
  UseGuards,
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

import { UpdateExerciseDto } from "@/src/context/exercises/dto/update-exercise.dto";
import { GetRoutinesDto } from "@/src/context/routines/dto/get-routines.dto";
import { RoutinesService } from "@/src/context/routines/routines.service";
import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { validateMongoId } from "@/src/context/shared/utils/validateMongoId.validator";

import { CreateRoutineDto } from "./dto/create-routine.dto";

@ApiTags("routines")
@Controller("routines")
export class RoutinesController {
  private readonly logger = new Logger(RoutinesController.name);

  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Crear una nueva rutina" })
  @ApiResponse({ status: 201, description: "Rutina creada exitosamente." })
  @ApiResponse({ status: 400, description: "Datos inválidos." })
  @ApiBody({ type: CreateRoutineDto })
  async createRoutine(@Body() createRoutineDto: CreateRoutineDto) {
    this.logger.log("Creating a new routine with data:", createRoutineDto);
    try {
      const routine =
        await this.routinesService.createRoutine(createRoutineDto);
      this.logger.log(`Routine created successfully with ID: ${routine._id}`);
      return routine;
    } catch (error) {
      this.logger.error("Failed to create routine:", error);
      throw error;
    }
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Eliminar una rutina por ID" })
  @ApiResponse({ status: 200, description: "Rutina eliminada exitosamente." })
  @ApiResponse({ status: 404, description: "Rutina no encontrada." })
  @ApiParam({ name: "id", type: String, description: "ID de la rutina" })
  @UsePipes(new ValidationPipe({ transform: true }))
  async deleteRoutine(@Param("id") id: string) {
    this.logger.log(`Attempting to delete routine with ID: ${id}`);
    if (validateMongoId(id)) {
      const result = await this.routinesService.deleteRoutine(id);
      if (!result) {
        this.logger.warn(`Routine with ID: ${id} not found for deletion.`);
        throw new NotFoundException(`Routine with ID ${id} not found`);
      }
      this.logger.log(`Routine with ID: ${id} deleted successfully.`);
      return { message: "Routine deleted successfully." };
    } else {
      throw new BadRequestException(`${id} is not a valid MongoDB ID`);
    }
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
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
  async findAll(@Query() getRoutinesDto: GetRoutinesDto) {
    this.logger.log("Retrieving routines with filters:", getRoutinesDto);
    try {
      const routines = await this.routinesService.getRoutines(
        getRoutinesDto.page,
        getRoutinesDto.limit,
        getRoutinesDto.name,
        getRoutinesDto.type,
        getRoutinesDto.mode,
      );
      this.logger.log(`Retrieved ${routines.data.length} routines.`);
      return routines;
    } catch (error) {
      this.logger.error("Failed to retrieve routines:", error);
      throw error;
    }
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Obtener una rutina por ID" })
  @ApiResponse({ status: 200, description: "Rutina encontrada." })
  @ApiResponse({ status: 404, description: "Rutina no encontrada." })
  @ApiParam({ name: "id", type: String, description: "ID de la rutina" })
  async findOne(@Param("id") id: string) {
    this.logger.log(`Searching for routine with ID: ${id}`);
    const routine = await this.routinesService.findOne(id);
    if (!routine) {
      this.logger.warn(`Routine with ID: ${id} not found.`);
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }
    this.logger.log(`Routine with ID: ${id} found.`);
    return routine;
  }

  @Put(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
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
  @ApiBody({ type: UpdateExerciseDto })
  async update(
    @Param("id") id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @Query("clientId") clientId?: string,
  ) {
    this.logger.log(`Updating routine with ID: ${id}`);
    try {
      const updatedRoutine = await this.routinesService.updateRoutine(
        id,
        updateExerciseDto,
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
}

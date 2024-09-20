import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { FiltersDto } from "@/src/context/exercises/dto/filters.dto";
import { UpdateExerciseDto } from "@/src/context/exercises/dto/update-exercise.dto";
import { RoutinesService } from "@/src/context/routines/routines.service";
import { PageDto } from "@/src/context/shared/dtos/page.dto";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { Role } from "@/src/context/shared/constants/roles.constant";

import { CreateRoutineDto } from "./dto/create-routine.dto";

@ApiTags("routines")
@Controller("routines")
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Crear una nueva rutina" })
  @ApiResponse({ status: 201, description: "Rutina creada exitosamente." })
  @ApiBody({ type: CreateRoutineDto })
  async createRoutine(@Body() createRoutineDto: CreateRoutineDto) {
    return await this.routinesService.createRoutine(createRoutineDto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Eliminar una rutina por ID" })
  @ApiResponse({ status: 200, description: "Rutina eliminada exitosamente." })
  @ApiResponse({ status: 404, description: "Rutina no encontrada." })
  @ApiParam({ name: "id", type: String, description: "ID de la rutina" })
  async deleteRoutine(@Param("id") id: string) {
    return this.routinesService.deleteRoutine(id);
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: "Obtener todas las rutinas con paginación y filtros",
  })
  @ApiResponse({ status: 200, description: "Lista de rutinas." })
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
  findAll(@Query() pageDto: PageDto, @Query() filtersDto: FiltersDto) {
    return this.routinesService.getRoutines(
      pageDto.page,
      pageDto.limit,
      filtersDto.name,
      filtersDto.type,
      filtersDto.mode,
    );
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Obtener una rutina por ID" })
  @ApiResponse({ status: 200, description: "Rutina encontrada." })
  @ApiResponse({ status: 404, description: "Rutina no encontrada." })
  @ApiParam({ name: "id", type: String, description: "ID de la rutina" })
  findOne(@Param("id") id: string) {
    return this.routinesService.findOne(id);
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
  update(
    @Param("id") id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @Query("clientId") clientId?: string | undefined,
  ) {
    return this.routinesService.updateRoutine(id, updateExerciseDto, clientId);
  }
}

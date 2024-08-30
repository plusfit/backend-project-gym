import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

import { FiltersDto } from "@/src/context/exercises/dto/filters.dto";
import { UpdateExerciseDto } from "@/src/context/exercises/dto/update-exercise.dto";
import { RoutinesService } from "@/src/context/routines/routines.service";
import { PageDto } from "@/src/context/shared/dtos/page.dto";

import { CreateRoutineDto } from "./dto/create-routine.dto";

@Controller("routines")
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  async createRoutine(@Body() createRoutineDto: CreateRoutineDto) {
    return await this.routinesService.createRoutine(createRoutineDto);
  }

  @Delete(":id")
  async deleteRoutine(@Param("id") id: string) {
    return this.routinesService.deleteRoutine(id);
  }

  @Get()
  findAll(@Query() pageDto: PageDto, @Query() filtersDto: FiltersDto) {
    //TODO: ADD LOGS
    return this.routinesService.getRoutines(
      pageDto.page,
      pageDto.limit,
      filtersDto.name,
      filtersDto.type,
      filtersDto.mode,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.routinesService.findOne(id);
  }

  @Put(":id")
  @ApiQuery({ name: "clientId", required: false, type: String })
  update(
    @Param("id") id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
    @Query("clientId") clientId?: string | undefined,
  ) {
    return this.routinesService.updateRoutine(id, updateExerciseDto, clientId);
  }
}

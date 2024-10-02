import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { FiltersDto } from "@/src/context/exercises/dto/filters.dto";
import { PageDto } from "@/src/context/shared/dtos/page.dto";

import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
import { ExercisesService } from "./exercises.service";

@ApiTags("exercises")
@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @Get()
  findAll(@Query() pageDto: PageDto, @Query() filtersDto: FiltersDto) {
    //TODO: ADD LOGS
    return this.exercisesService.getExercises(
      pageDto.page,
      pageDto.limit,
      filtersDto.name,
      filtersDto.type,
      filtersDto.mode,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.exercisesService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.exercisesService.remove(id);
  }
}

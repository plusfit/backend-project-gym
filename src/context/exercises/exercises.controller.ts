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
import { ApiTags } from "@nestjs/swagger";

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { GetExercisesDto } from "./dto/get-exercises.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
import { ExercisesService } from "./exercises.service";

@ApiTags("exercises")
@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  findAll(@Query() getExercisesDto: GetExercisesDto) {
    //TODO: ADD LOGS
    return this.exercisesService.getExercises(
      getExercisesDto.page,
      getExercisesDto.limit,
      getExercisesDto.name,
      getExercisesDto.type,
    );
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  findOne(@Param("id") id: string) {
    return this.exercisesService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  update(
    @Param("id") id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.exercisesService.remove(id);
  }
}

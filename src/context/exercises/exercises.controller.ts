import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { GetExerciseDto } from "@/src/context/exercises/dto/get-exercise.dto";

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { Permissions } from "@/src/context/shared/guards/permissions/permissions.decorator";
import { PermissionsGuard } from "@/src/context/shared/guards/permissions/permissions.guard";
import { Permission } from "@/src/context/shared/enums/permissions.enum";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
import { ExercisesService } from "./exercises.service";

@ApiTags("exercises")
@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.EXERCISE_CREATE)
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.EXERCISE_READ)
  findAll(@Query() getExercisesDto: GetExerciseDto) {
    return this.exercisesService.getExercises(
      getExercisesDto.page,
      getExercisesDto.limit,
      getExercisesDto.name,
      getExercisesDto.type,
      getExercisesDto.category,
    );
  }

  @Get(":id")
  // @Roles(Role.Admin, Role.Client)
  // @UseGuards(RolesGuard)
  findOne(@Param("id") id: string) {
    return this.exercisesService.findOne(id);
  }

  @Patch(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.EXERCISE_UPDATE)
  update(
    @Param("id") id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, updateExerciseDto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  // UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

// import { Role } from "@/src/context/shared/constants/roles.constant";
// import { PageDto } from "@/src/context/shared/dtos/page.dto";
// import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
// import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";
import { ExercisesService } from "./exercises.service";
import { GetExerciseDto } from "@/src/context/exercises/dto/get-exercise.dto";

@ApiTags("exercises")
@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @Get()
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  findAll(@Query() getExercisesDto: GetExerciseDto) {
    return this.exercisesService.getExercises(
      getExercisesDto.page,
      getExercisesDto.limit,
      getExercisesDto.name,
      getExercisesDto.type,
      getExercisesDto.mode,
    );
  }

  @Get(":id")
  // @Roles(Role.Admin, Role.Client)
  // @UseGuards(RolesGuard)
  findOne(@Param("id") id: string) {
    return this.exercisesService.findOne(id);
  }

  @Patch(":id")
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  update(
    @Param("id") id: string,
    @Body() updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  @Delete(":id")
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.exercisesService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { CreateExcerciseDto } from "./dto/create-excercise.dto";
import { UpdateExcerciseDto } from "./dto/update-excercise.dto";
import { ExcercisesService } from "./excercises.service";

@Controller("excercises")
export class ExcercisesController {
  constructor(private readonly excercisesService: ExcercisesService) {}

  @Post()
  create(@Body() createExcerciseDto: CreateExcerciseDto) {
    return this.excercisesService.create(createExcerciseDto);
  }

  @Get()
  findAll() {
    return this.excercisesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.excercisesService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateExcerciseDto: UpdateExcerciseDto,
  ) {
    return this.excercisesService.update(+id, updateExcerciseDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.excercisesService.remove(+id);
  }
}

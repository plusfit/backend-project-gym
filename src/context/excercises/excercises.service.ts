import { Injectable } from "@nestjs/common";

import { CreateExcerciseDto } from "./dto/create-excercise.dto";
import { UpdateExcerciseDto } from "./dto/update-excercise.dto";

@Injectable()
export class ExcercisesService {
  create(createExcerciseDto: CreateExcerciseDto) {
    return createExcerciseDto;
  }

  findAll() {
    return `This action returns all excercises`;
  }

  findOne(id: number) {
    return `This action returns a #${id} excercise`;
  }

  update(id: number, updateExcerciseDto: UpdateExcerciseDto) {
    return updateExcerciseDto;
  }

  remove(id: number) {
    return `This action removes a #${id} excercise`;
  }
}

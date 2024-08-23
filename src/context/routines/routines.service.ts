import { Injectable } from "@nestjs/common";

import { CreateRoutineDto } from "./dto/create-routine.dto";
import { UpdateRoutineDto } from "./dto/update-routine.dto";

@Injectable()
export class RoutinesService {
  create(createRoutineDto: CreateRoutineDto) {
    return createRoutineDto;
  }

  findAll() {
    return `This action returns all routines`;
  }

  findOne(id: number) {
    return `This action returns a #${id} routine`;
  }

  update(id: number, updateRoutineDto: UpdateRoutineDto) {
    return updateRoutineDto;
  }

  remove(id: number) {
    return `This action removes a #${id} routine`;
  }
}

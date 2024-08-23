import { Injectable } from "@nestjs/common";

import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

@Injectable()
export class SchedulesService {
  create(createScheduleDto: CreateScheduleDto) {
    return createScheduleDto;
  }

  findAll() {
    return `This action returns all schedules`;
  }

  findOne(id: number) {
    return `This action returns a #${id} schedule`;
  }

  update(id: number, updateScheduleDto: UpdateScheduleDto) {
    return updateScheduleDto;
  }

  remove(id: number) {
    return `This action removes a #${id} schedule`;
  }
}

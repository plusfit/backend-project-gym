import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { SCHEDULE_REPOSITORY } from "@/src/context/schedules/repositories/mongo-schedule.repository";

import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: any,
  ) {}

  async createSchedule(createScheduleDto: CreateScheduleDto) {
    if (!createScheduleDto) {
      throw new BadRequestException("Invalid schedule data");
    }

    for (const clientId of createScheduleDto.clients) {
      const clientExists = await this.scheduleRepository.findById(clientId);
      if (!clientExists) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }
    }

    return await this.scheduleRepository.createSchedule(createScheduleDto);
  }

  async deleteSchedule(id: string) {
    if (!id) {
      throw new BadRequestException("Schedule ID is required");
    }

    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return this.scheduleRepository.deleteSchedule(id);
  }

  async updateSchedule(scheduleId: string, updateData: UpdateScheduleDto) {
    if (!scheduleId || !updateData) {
      throw new BadRequestException("Schedule ID and update data are required");
    }

    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }
    return this.scheduleRepository.updateSchedule(scheduleId, updateData);
  }

  async getSchedule(id: string) {
    if (!id) {
      throw new BadRequestException("Schedule ID is required");
    }

    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async getAllSchedules() {
    return await this.scheduleRepository.getSchedules();
  }

  async deleteAllClientSchedules(clientId: string) {
    if (!clientId) {
      throw new BadRequestException("Client ID is required");
    }

    const result =
      await this.scheduleRepository.deleteAllClientSchedules(clientId);

    if (result.modifiedCount === 0) {
      throw new NotFoundException(
        `No schedules found with client ID ${clientId}`,
      );
    }

    return { message: `Client with ID ${clientId} removed from all schedules` };
  }
}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { SCHEDULE_REPOSITORY } from "@/src/context/schedules/repositories/mongo-schedule.repository";

import { ConfigService } from "../config/config.service";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: any,
    private readonly configService: ConfigService,
    //Client Repository
  ) {}

  async createSchedule(createScheduleDto: CreateScheduleDto) {
    if (!createScheduleDto) {
      throw new BadRequestException("Invalid schedule data");
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
    //TODO: Change to client repo
    // if(updateData.clients) {
    //   for (const clientId of updateData.clients) {
    //     const clientExists = await this.scheduleRepository.findById(clientId);
    //     if (!clientExists) {
    //       throw new NotFoundException(`Client with ID ${clientId} not found`);
    //     }
    //   }
    // }
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

  async assignClientToSchedule(scheduleId: string, clientId: string) {
    if (!scheduleId || !clientId) {
      throw new BadRequestException("Schedule ID and Client ID are required");
    }

    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }
    //TODO: Change to clientRepository
    // const clientExists = await this.scheduleRepository.findById(clientId);
    // if (!clientExists) {
    //   throw new NotFoundException(`Client with ID ${clientId} not found`);
    // }

    return this.scheduleRepository.assignClientToSchedule(scheduleId, clientId);
  }

  async deleteClientFromSchedule(scheduleId: string, clientId: string) {
    if (!scheduleId || !clientId) {
      throw new BadRequestException("Schedule ID and Client ID are required");
    }

    const schedule = this.scheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    return await this.scheduleRepository.deleteClientFromSchedule(
      scheduleId,
      clientId,
    );
  }

  async populateSchedulesByConfig() {
    const schedules = await this.getAllSchedules();
    if (schedules.length > 0) {
      throw new BadRequestException("Schedules collection is not empty");
    }

    const config = await this.configService.getConfigs();
    if (config.schedule.length === 0) {
      throw new BadRequestException("Config Schedules collection is empty");
    }

    const scheduleConfig = config.schedule;
    for (const day of scheduleConfig) {
      for (const hour of day.hours) {
        const schedule = {
          day: day.day,
          startTime: Number(hour).toString(),
          endTime: (Number(hour) + 1).toString(),
          clients: [],
          maxCount: day.maxCount,
        };
        await this.createSchedule(schedule);
      }
    }

    return {
      success: true,
      message: "Horarios creados exitosamente",
    };
  }
}

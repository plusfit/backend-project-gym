import { InjectModel } from "@nestjs/mongoose";
import { Model, UpdateWriteOpResult } from "mongoose";

import { CreateScheduleDto } from "@/src/context/schedules/dto/create-schedule.dto";

import { Schedule } from "../schemas/schedule.schema";
import { ScheduleRepository } from "./schedule.repository";
export const SCHEDULE_REPOSITORY = "ScheduleRepository";

export class MongoScheduleRepository implements ScheduleRepository {
  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<Schedule>,
  ) {}

  async findById(id: string): Promise<Schedule | null> {
    return this.scheduleModel.findById(id).exec();
  }

  async updateSchedule(id: string, updateData: any): Promise<Schedule | null> {
    return this.scheduleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async createSchedule(schedule: CreateScheduleDto): Promise<Schedule> {
    const newSchedule = new this.scheduleModel(schedule);
    return newSchedule.save();
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.scheduleModel.findByIdAndDelete(id).exec();
  }

  async getSchedules(): Promise<Schedule[]> {
    return await this.scheduleModel.find().exec();
  }

  async countSchedules(filters: any): Promise<number> {
    return await this.scheduleModel.countDocuments(filters).exec();
  }

  async deleteAllClientSchedules(
    clientId: string,
  ): Promise<UpdateWriteOpResult> {
    return await this.scheduleModel
      .updateMany({ clients: clientId }, { $pull: { clients: clientId } })
      .exec();
  }

  async assignClientToSchedule(scheduleId: string, clientId: string) {
    return this.scheduleModel
      .findByIdAndUpdate(
        scheduleId,
        { $push: { clients: clientId } },
        { new: true },
      )
      .exec();
  }
  deleteClientFromSchedule(scheduleId: string, clientId: string): Promise<any> {
    return this.scheduleModel
      .findByIdAndUpdate(
        scheduleId,
        { $pull: { clients: clientId } },
        { new: true },
      )
      .exec();
  }
}

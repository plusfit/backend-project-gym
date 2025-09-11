import { UpdateWriteOpResult } from "mongoose";

import { CreateScheduleDto } from "@/src/context/schedules/dto/create-schedule.dto";
import { Schedule } from "@/src/context/schedules/schemas/schedule.schema";

import { UpdateConfigDto } from "../../config/dto/update-config.dto";

export interface ScheduleRepository {
	findById(id: string): Promise<Schedule | null>;
	updateSchedule(id: string, updateData: any): Promise<Schedule | null>;
	createSchedule(schedule: CreateScheduleDto): Promise<Schedule>;
	deleteSchedule(id: string): Promise<void>;
	countSchedules(filters: any): Promise<number>;
	getSchedules(): Promise<Schedule[]>;
	deleteAllClientSchedules(clientId: string): Promise<UpdateWriteOpResult>;
	assignClientToSchedule(
		scheduleId: string,
		clientId: { clients: string[] },
	): Promise<any>;
	deleteClientFromSchedule(scheduleId: string, clientId: string): Promise<any>;
	updateScheduleConfig(
		id: string,
		updateConfigDto: UpdateConfigDto,
	): Promise<any>;
	getSchedulesByUserId(userId: string): Promise<Schedule[]>;
	getSchedulesByDay(day: string): Promise<Schedule[]>;
	getDisabledSchedules(): Promise<Schedule[]>;
}

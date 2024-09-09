import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import {
  MongoScheduleRepository,
  SCHEDULE_REPOSITORY,
} from "@/src/context/schedules/repositories/mongo-schedule.repository";
import {
  Schedule,
  ScheduleSchema,
} from "@/src/context/schedules/schemas/schedule.schema";

import { SchedulesController } from "./schedules.controller";
import { SchedulesService } from "./schedules.service";

@Module({
  controllers: [SchedulesController],
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  providers: [
    SchedulesService,
    {
      provide: SCHEDULE_REPOSITORY,
      useClass: MongoScheduleRepository,
    },
  ],
  exports: [SCHEDULE_REPOSITORY],
})
export class SchedulesModule {}

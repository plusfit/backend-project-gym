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
import { ConfigService } from "@/src/context/config/config.service";
import { AppConfigModule } from "@/src/context/config/config.module";

@Module({
  controllers: [SchedulesController],
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    AppConfigModule,
  ],
  providers: [
    SchedulesService,
    ConfigService,
    {
      provide: SCHEDULE_REPOSITORY,
      useClass: MongoScheduleRepository,
    },
  ],
  exports: [SCHEDULE_REPOSITORY],
})
export class SchedulesModule {}

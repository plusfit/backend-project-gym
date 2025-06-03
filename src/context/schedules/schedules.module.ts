import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AppConfigModule } from "@/src/context/config/config.module";
import { ConfigService } from "@/src/context/config/config.service";
import { SharedModule } from "@/src/context/shared/shared.module";
import { OrganizationsModule } from "@/src/context/organizations/organizations.module";
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
    AppConfigModule,
    SharedModule,
    forwardRef(() => OrganizationsModule),
  ],
  providers: [
    SchedulesService,
    ConfigService,
    {
      provide: SCHEDULE_REPOSITORY,
      useClass: MongoScheduleRepository,
    },
  ],
  exports: [SCHEDULE_REPOSITORY, SchedulesService],
})
export class SchedulesModule {}

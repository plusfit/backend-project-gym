import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { SchedulesModule } from "../schedules/schedules.module";
import { SharedModule } from "@/src/context/shared/shared.module";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { MongoPlansRepository } from "./repositories/mongo-plans.repository";
import { PLAN_REPOSITORY } from "./repositories/plans.repository";
import { PlanSchema } from "./schemas/plan.schema";
import { Client, ClientSchema } from "../clients/schemas/client.schema";
import { Schedule, ScheduleSchema } from "../schedules/schemas/schedule.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "Plan", schema: PlanSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    SchedulesModule,
    SharedModule,
  ],
  providers: [
    PlansService,
    {
      provide: PLAN_REPOSITORY,
      useClass: MongoPlansRepository,
    },
  ],
  controllers: [PlansController],
  exports: [PlansService, PLAN_REPOSITORY],
})
export class PlansModule {}

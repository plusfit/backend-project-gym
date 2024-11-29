import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsModule } from "../clients/clients.module";
import { SchedulesModule } from "../schedules/schedules.module";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { MongoPlansRepository } from "./repositories/mongo-plans.repository";
import { PLAN_REPOSITORY } from "./repositories/plans.repository";
import { PlanSchema } from "./schemas/plan.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Plan", schema: PlanSchema }]),
    ClientsModule,
    SchedulesModule,
  ],
  providers: [
    PlansService,
    {
      provide: PLAN_REPOSITORY,
      useClass: MongoPlansRepository,
    },
  ],
  controllers: [PlansController],
})
export class PlansModule {}

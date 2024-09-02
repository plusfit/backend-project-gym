import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { MongoPlansRepository } from "./repositories/mongo-plans.repository";
import { PLAN_REPOSITORY } from "./repositories/plans.repository";
import { PlanSchema } from "./schemas/plans.schemas";

@Module({
  imports: [MongooseModule.forFeature([{ name: "Plan", schema: PlanSchema }])],
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

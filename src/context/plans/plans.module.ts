import { Module, forwardRef } from "@nestjs/common";
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
		forwardRef(() => ClientsModule),
		MongooseModule.forFeature([{ name: "Plan", schema: PlanSchema }]),
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
	exports: [PlansService, PLAN_REPOSITORY],
})
export class PlansModule {}

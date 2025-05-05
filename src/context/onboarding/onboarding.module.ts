import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { OnboardingRepository } from "./repositories/onboarding.repository";
import { Onboarding, OnboardingSchema } from "./schemas/onboarding.schema";
import { PlanRecommendationService } from "./services/plan-recommendation.service";
import { PLAN_REPOSITORY } from "../plans/repositories/plans.repository";
import { MongoPlansRepository } from "../plans/repositories/mongo-plans.repository";
import { ClientsModule } from "../clients/clients.module";
import { Plan, PlanSchema } from "../plans/schemas/plan.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Onboarding.name, schema: OnboardingSchema },
			{ name: Plan.name, schema: PlanSchema },
		]),
		ClientsModule,
	],
	controllers: [OnboardingController],
	providers: [
		OnboardingService,
		OnboardingRepository,
		PlanRecommendationService,
		{
			provide: PLAN_REPOSITORY,
			useClass: MongoPlansRepository,
		},
	],
	exports: [OnboardingService],
})
export class OnboardingModule {}

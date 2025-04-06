import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { OnboardingRepository } from "./repositories/onboarding.repository";
import { Onboarding, OnboardingSchema } from "./schemas/onboarding.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Onboarding.name, schema: OnboardingSchema },
		]),
	],
	controllers: [OnboardingController],
	providers: [OnboardingService, OnboardingRepository],
	exports: [OnboardingService],
})
export class OnboardingModule {}

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AUTH_REPOSITORY } from "@/src/context/auth/repositories/auth.repository";
import { MongoAuthRepository } from "@/src/context/auth/repositories/mongo-auth.repository";
import { ClientsModule } from "@/src/context/clients/clients.module";
import { RecaptchaService } from "@/src/context/shared/services/recaptcha.service";

import { OnboardingModule } from "../onboarding/onboarding.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { InvitationCode, InvitationCodeSchema } from "./schemas/invitation-code.schema";

@Module({
	controllers: [AuthController],

	providers: [
		AuthService,
		RecaptchaService,
		{
			provide: AUTH_REPOSITORY,
			useClass: MongoAuthRepository,
		},
	],
	imports: [
		ClientsModule, 
		OnboardingModule,
		MongooseModule.forFeature([
			{ name: InvitationCode.name, schema: InvitationCodeSchema },
		]),
	],
})
export class AuthModule {}

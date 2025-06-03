import { Module, forwardRef } from "@nestjs/common";

import { AUTH_REPOSITORY } from "@/src/context/auth/repositories/auth.repository";
import { MongoAuthRepository } from "@/src/context/auth/repositories/mongo-auth.repository";
import { ClientsModule } from "@/src/context/clients/clients.module";
import { JwtAuthGuard } from "@/src/context/shared/guards/jwt-auth.guard";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OnboardingModule } from "../onboarding/onboarding.module";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({
  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
    {
      provide: AUTH_REPOSITORY,
      useClass: MongoAuthRepository,
    },
  ],
  imports: [
    ClientsModule,
    OnboardingModule,
    forwardRef(() => OrganizationsModule),
  ],
})
export class AuthModule {}

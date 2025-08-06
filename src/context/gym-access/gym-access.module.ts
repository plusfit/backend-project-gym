import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsModule } from "@/src/context/clients/clients.module";
import { SchedulesModule } from "@/src/context/schedules/schedules.module";
import { RewardsModule } from "@/src/context/rewards/rewards.module";
import { ClientSchema } from "@/src/context/clients/schemas/client.schema";

import { GymAccessController } from "./gym-access.controller";
import { GymAccessService } from "./gym-access.service";
import { GymAccessSchema } from "./schemas/gym-access.schema";
import { GymAccessRepository } from "./repositories/gym-access.repository";
import { MongoGymAccessRepository } from "./repositories/mongo-gym-access.repository";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: "GymAccess", schema: GymAccessSchema },
			{ name: "Client", schema: ClientSchema },
		]),
		ClientsModule,
		SchedulesModule,
		RewardsModule,
	],
	controllers: [GymAccessController],
	providers: [
		GymAccessService,
		{
			provide: GymAccessRepository,
			useClass: MongoGymAccessRepository,
		},
	],
	exports: [GymAccessService, GymAccessRepository],
})
export class GymAccessModule {}
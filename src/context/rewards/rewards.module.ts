import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MongoRewardRepository } from "./repositories/mongo-reward.repository";
import { RewardRepository } from "./repositories/reward.repository";
import { RewardsController } from "./rewards.controller";
import { RewardsService } from "./rewards.service";
import { RewardSchema } from "./schemas/reward.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: "Reward", schema: RewardSchema },
		]),
	],
	controllers: [RewardsController],
	providers: [
		RewardsService,
		{
			provide: RewardRepository,
			useClass: MongoRewardRepository,
		},
	],
	exports: [RewardsService, RewardRepository],
})
export class RewardsModule {}
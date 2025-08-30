import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClientsModule } from '../clients/clients.module';
import { ExchangeRepository } from './repositories/exchange.repository';
import { MongoExchangeRepository } from './repositories/mongo-exchange.repository';
import { MongoRewardRepository } from './repositories/mongo-reward.repository';
import { RewardRepository } from './repositories/reward.repository';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { Exchange, ExchangeSchema } from './schemas/exchange.schema';
import { Reward, RewardSchema } from './schemas/reward.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reward.name, schema: RewardSchema },
      { name: Exchange.name, schema: ExchangeSchema },
    ]),
    ClientsModule,
  ],
  controllers: [RewardsController],
  providers: [
    RewardsService,
    {
      provide: RewardRepository,
      useClass: MongoRewardRepository,
    },
    {
      provide: ExchangeRepository,
      useClass: MongoExchangeRepository,
    },
  ],
  exports: [RewardsService],
})
export class RewardsModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClientsModule } from '../clients/clients.module';
import { PremiosController } from './premios.controller';
import { PremiosService } from './premios.service';
import { CanjeRepository } from './repositories/canje.repository';
import { MongoCanjeRepository } from './repositories/mongo-canje.repository';
import { MongoPremioRepository } from './repositories/mongo-premio.repository';
import { PremioRepository } from './repositories/premio.repository';
import { Canje, CanjeSchema } from './schemas/canje.schema';
import { Premio, PremioSchema } from './schemas/premio.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Premio.name, schema: PremioSchema },
      { name: Canje.name, schema: CanjeSchema },
    ]),
    ClientsModule,
  ],
  controllers: [PremiosController],
  providers: [
    PremiosService,
    {
      provide: PremioRepository,
      useClass: MongoPremioRepository,
    },
    {
      provide: CanjeRepository,
      useClass: MongoCanjeRepository,
    },
  ],
  exports: [PremiosService],
})
export class PremiosModule {}
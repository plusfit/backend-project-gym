import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsController } from "@/src/context/clients/clients.controller";
import { ClientsService } from "@/src/context/clients/clients.service";
import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";
import { MongoClientsRepository } from "@/src/context/clients/repositories/mongo-clients.repository";
import {
  Client,
  ClientSchema,
} from "@/src/context/clients/schemas/client.schema";
import { PlansModule } from "@/src/context/plans/plans.module";
import { RoutinesModule } from "@/src/context/routines/routines.module";
import { SchedulesModule } from "../schedules/schedules.module";
import { SharedModule } from "../shared/shared.module";

@Module({
  imports: [
    forwardRef(() => PlansModule),
    forwardRef(() => RoutinesModule),
    SchedulesModule,
    SharedModule,
    MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
  ],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    {
      provide: CLIENT_REPOSITORY,
      useClass: MongoClientsRepository,
    },
  ],
  exports: [MongooseModule, CLIENT_REPOSITORY, ClientsService],
})
export class ClientsModule {}

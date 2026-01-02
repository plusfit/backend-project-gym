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

import { SchedulesModule } from "../schedules/schedules.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { Routine, RoutineSchema } from "../routines/schemas/routine.schema";
import { DailyDecrementService } from "./services/daily-decrement.service";
import { YearlyPointsResetService } from "./services/yearly-points-reset.service";
import { AvailableDaysController } from "./available-days.controller";

@Module({
  imports: [
    forwardRef(() => PlansModule),
    forwardRef(() => SchedulesModule),
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Routine.name, schema: RoutineSchema },
    ]),
  ],
  controllers: [ClientsController, AvailableDaysController],
  providers: [
    ClientsService,
    DailyDecrementService,
    YearlyPointsResetService,
    {
      provide: CLIENT_REPOSITORY,
      useClass: MongoClientsRepository,
    },
  ],
  exports: [MongooseModule, CLIENT_REPOSITORY, ClientsService, DailyDecrementService, YearlyPointsResetService],
})
export class ClientsModule { }

import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsController } from "@/src/context/clients/clients.controller";
import { ClientsService } from "@/src/context/clients/clients.service";
import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";
import { MongoClientsRepository } from "@/src/context/clients/repositories/mongo-clients.repository";
import {
  Client,
  ClientSchema,
} from "@/src/context/clients/schemas/client.schema";
import { RoutinesModule } from "@/src/context/routines/routines.module";
import { SchedulesModule } from "../schedules/schedules.module";
import { SharedModule } from "../shared/shared.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { Plan, PlanSchema } from "../plans/schemas/plan.schema";
import { Schedule, ScheduleSchema } from "../schedules/schemas/schedule.schema";
import { Routine, RoutineSchema } from "../routines/schemas/routine.schema";

@Module({
  imports: [
    RoutinesModule,
    SchedulesModule,
    SharedModule,
    forwardRef(() => OrganizationsModule),
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Routine.name, schema: RoutineSchema },
    ]),
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

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ClientsModule } from "@/src/context/clients/clients.module";
import { ExercisesModule } from "@/src/context/exercises/exercises.module";
import { PlansModule } from "@/src/context/plans/plans.module";
import { MongoRoutineRepository } from "@/src/context/routines/repositories/mongo-routine.repository";
import {
  MongoSubRoutineRepository,
  ROUTINE_REPOSITORY,
  SUB_ROUTINE_REPOSITORY,
} from "@/src/context/routines/repositories/mongo-sub-routine.repository";
import {
  Routine,
  RoutineSchema,
} from "@/src/context/routines/schemas/routine.schema";
import {
  SubRoutine,
  SubRoutineSchema,
} from "@/src/context/routines/schemas/sub-routine.schema";
import { RoutinesService } from "@/src/context/routines/services/routines.service";
import { SubRoutinesService } from "@/src/context/routines/services/sub-routines.service";

import { RoutinesController } from "./routines.controller";

@Module({
  controllers: [RoutinesController],
  imports: [
    MongooseModule.forFeature([
      { name: SubRoutine.name, schema: SubRoutineSchema },
      { name: Routine.name, schema: RoutineSchema },
    ]),
    ExercisesModule,
    ClientsModule,
    PlansModule,
  ],
  providers: [
    SubRoutinesService,
    RoutinesService,
    {
      provide: ROUTINE_REPOSITORY,
      useClass: MongoRoutineRepository,
    },
    {
      provide: SUB_ROUTINE_REPOSITORY,
      useClass: MongoSubRoutineRepository,
    },
  ],
  exports: [ROUTINE_REPOSITORY, SUB_ROUTINE_REPOSITORY],
})
export class RoutinesModule {}

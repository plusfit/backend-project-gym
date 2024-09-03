import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ExercisesModule } from "@/src/context/exercises/exercises.module";
import {
  MongoRoutineRepository,
  ROUTINE_REPOSITORY,
} from "@/src/context/routines/repositories/mongo-routine.repository";
import { RoutinesService } from "@/src/context/routines/routines.service";
import {
  Routine,
  RoutineSchema,
} from "@/src/context/routines/schemas/routine.schema";

import { RoutinesController } from "./routines.controller";

@Module({
  controllers: [RoutinesController],
  imports: [
    MongooseModule.forFeature([{ name: Routine.name, schema: RoutineSchema }]),
    ExercisesModule,
  ],
  providers: [
    RoutinesService,
    {
      provide: ROUTINE_REPOSITORY,
      useClass: MongoRoutineRepository,
    },
  ],
  exports: [ROUTINE_REPOSITORY],
})
export class RoutinesModule {}

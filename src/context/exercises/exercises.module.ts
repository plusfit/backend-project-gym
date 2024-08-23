import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { EXERCISE_REPOSITORY } from "@/src/context/exercises/repositories/exercise.repository";
import { MongoExercisesRepository } from "@/src/context/exercises/repositories/mongo-exercise.repository";
import { ExerciseSchema } from "@/src/context/exercises/schemas/exercise.schema";

import { ExercisesController } from "./exercises.controller";
import { ExercisesService } from "./exercises.service";

@Module({
  controllers: [ExercisesController],
  imports: [
    MongooseModule.forFeature([{ name: "Exercise", schema: ExerciseSchema }]),
  ],
  providers: [
    ExercisesService,
    {
      provide: EXERCISE_REPOSITORY,
      useClass: MongoExercisesRepository,
    },
  ],
})
export class ExercisesModule {}

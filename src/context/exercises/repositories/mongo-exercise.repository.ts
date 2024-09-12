import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateExerciseDto } from "@/src/context/exercises/dto/create-exercise.dto";
import { ExerciseRepository } from "@/src/context/exercises/repositories/exercise.repository";
import { Exercise } from "@/src/context/exercises/schemas/exercise.schema";

export class MongoExercisesRepository implements ExerciseRepository {
  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
  ) {}

  async createExercise(exercise: CreateExerciseDto): Promise<Exercise> {
    return await this.exerciseModel.create(exercise);
  }

  async getExercises(
    offset: number,
    limit: number,
    filters: { name?: string; exerciseType?: string } = {},
  ): Promise<Exercise[]> {
    try {
      const exercises = await this.exerciseModel
        .find(filters)
        .skip(offset)
        .limit(limit)
        .exec();
      return exercises;
    } catch {
      throw "Error fetching exercises";
    }
  }

  async countExercises(filters: any = {}): Promise<number> {
    return await this.exerciseModel.countDocuments(filters).exec();
  }

  async findOne(id: string): Promise<Exercise | null> {
    return await this.exerciseModel.findById(id).exec();
  }
}

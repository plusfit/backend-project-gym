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
    try {
      return await this.exerciseModel.create(exercise);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`Error creating exercise: ${error.message}`);
    }
  }

  async getExercises(
    offset: number,
    limit: number,
    filters: { name?: string; exerciseType?: string } = {},
  ): Promise<Exercise[]> {
    try {
      return await this.exerciseModel
        .find(filters)
        .skip(offset)
        .limit(limit)
        .exec();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`Error fetching exercises: ${error.message}`);
    }
  }

  async countExercises(filters: any = {}): Promise<number> {
    try {
      return await this.exerciseModel.countDocuments(filters).exec();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`Error counting exercises: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Exercise | undefined> {
    const exercise = await this.exerciseModel.findById(id).exec();
    return exercise ?? undefined;
  }
}

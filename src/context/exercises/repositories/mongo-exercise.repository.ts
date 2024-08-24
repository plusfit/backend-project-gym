import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateExerciseDto } from "@/src/context/exercises/dto/create-exercise.dto";
import { UpdateExerciseDto } from "@/src/context/exercises/dto/update-exercise.dto";
import { ExerciseRepository } from "@/src/context/exercises/repositories/exercise.repository";
import { Exercise } from "@/src/context/exercises/schemas/exercise.schema";

export class MongoExercisesRepository implements ExerciseRepository {
  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<Exercise>,
  ) { }

  async createExercise(exercise: CreateExerciseDto): Promise<Exercise> {
    return await this.exerciseModel.create(exercise);
  }

  async getExercises(
    offset: number,
    limit: number,
    filters: { name?: string; exerciseType?: string } = {},
  ): Promise<Exercise[]> {
    return await this.exerciseModel
      .find(filters)
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countExercises(filters: any = {}): Promise<number> {
    return await this.exerciseModel.countDocuments(filters).exec();
  }

  async findOne(id: string): Promise<Exercise | null> {
    return await this.exerciseModel.findById(id).exec();
  }

  async update(
    id: string,
    exercise: UpdateExerciseDto,
  ): Promise<Exercise | null> {
    const _exercise = await this.exerciseModel
      .findByIdAndUpdate(id, exercise, { new: true })
      .exec();
    // eslint-disable-next-line unicorn/no-null
    return _exercise ?? null;
  }
}

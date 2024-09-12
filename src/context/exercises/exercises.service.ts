import { Inject, Injectable } from "@nestjs/common";

import { EXERCISE_REPOSITORY } from "@/src/context/exercises/repositories/exercise.repository";

import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";

@Injectable()
export class ExercisesService {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: any,
  ) {}
  async create(createExcerciseDto: CreateExerciseDto) {
    return await this.exerciseRepository.createExercise(createExcerciseDto);
  }

  async getExercises(
    page: number,
    limit: number,
    name?: string,
    type?: string,
    mode?: string,
  ) {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (type) {
      filters.type = type;
    }

    if (mode) {
      filters.mode = mode;
    }

    const [data, total] = await Promise.all([
      this.exerciseRepository.getExercises(offset, limit, filters),
      this.exerciseRepository.countExercises(filters),
    ]);
    return { data, total, page, limit };
  }

  findOne(id: string) {
    return this.exerciseRepository.findOne(id);
  }

  async update(id: string, updateExcerciseDto: UpdateExerciseDto) {
    try {
      const exercise = await this.exerciseRepository.update(
        id,
        updateExcerciseDto,
      );
      if (exercise) {
        return {
          success: true,
          data: exercise,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  remove(id: string) {
    return `This action removes a #${id} excercise`;
  }
}

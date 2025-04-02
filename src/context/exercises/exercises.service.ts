import { Inject, Injectable } from "@nestjs/common";

import { CreateExerciseDto } from "@/src/context/exercises/dto/create-exercise.dto";
import { UpdateExerciseDto } from "@/src/context/exercises/dto/update-exercise.dto";
import { EXERCISE_REPOSITORY } from "@/src/context/exercises/repositories/exercise.repository";

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
    categrie?: string,
  ) {
    const offset = (page - 1) * limit;
    const filters: any = { $or: [] };

    // Si 'name' tiene valor, agrega un filtro con $or
    if (name) {
      filters.$or.push({ name: { $regex: name, $options: "i" } });
    }

    // Si 'type' tiene valor, agrega un filtro con $or
    if (type) {
      filters.$or.push({ type: type });
    }

    // Si 'categrie' tiene valor, agrega un filtro con $or
    if (categrie) {
      filters.$or.push({ categorie: { $regex: categrie, $options: "i" } });
    }

    // Si no hay filtros en $or, eliminamos el campo $or
    if (filters.$or.length === 0) {
      delete filters.$or;
    }

    const [data, total] = await Promise.all([
      this.exerciseRepository.getExercises(offset, limit, filters),
      this.exerciseRepository.countExercises(filters),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    try {
      const exercise = await this.exerciseRepository.findOne(id);
      if (exercise) {
        return exercise;
      } else {
        throw "Exercise not found";
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Exercise cannot be found: ${error.message}`,
      };
    }
  }

  async update(id: string, updateExcerciseDto: UpdateExerciseDto) {
    try {
      const _updateExcerciseDto = { ...updateExcerciseDto };
      _updateExcerciseDto.updatedAt = new Date();
      const exercise = await this.exerciseRepository.update(
        id,
        _updateExcerciseDto,
      );
      if (exercise) {
        return {
          exercise,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Exercise cannot be updated: ${error.message}`,
      };
    }
  }

  async remove(id: string): Promise<string> {
    // TODO: Delete the exercise from the subroutines
    try {
      const wasRemoved = await this.exerciseRepository.remove(id);

      if (wasRemoved) {
        return "Exerscise removed successfully";
      } else {
        throw new Error("Exercise not found");
      }
    } catch (error: any) {
      throw new Error(`Error when trying to delete exercise: ${error.message}`);
    }
  }
}

import {
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EXERCISE_REPOSITORY } from "@/src/context/exercises/repositories/exercise.repository";
import { CreateSubRoutineDto } from "@/src/context/routines/dto/create-sub-routine.dto";
import { SUB_ROUTINE_REPOSITORY } from "@/src/context/routines/repositories/mongo-sub-routine.repository";

@Injectable()
export class SubRoutinesService {
  static removeExerciseFromSubRoutines: any;
  constructor(
    @Inject(SUB_ROUTINE_REPOSITORY)
    private readonly subRoutineRepository: any,
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: any,
  ) {}

  async createSubRoutine(createSubRoutineDto: CreateSubRoutineDto) {
    for (const exerciseId of createSubRoutineDto.exercises) {
      if (!exerciseId) {
        throw new HttpException("Exercise ID is required", 500);
      }
      const exerciseExists = await this.exerciseRepository.findOne(exerciseId);
      if (!exerciseExists) {
        throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
      }
    }
    return this.subRoutineRepository.createSubRoutine(createSubRoutineDto);
  }

  async deleteSubRoutine(id: string) {
    const subroutine = await this.getSubRoutineById(id);

    if (!subroutine) {
      throw new NotFoundException(`Subroutine with ID ${id} not found`);
    }

    const result = await this.subRoutineRepository.deleteSubRoutine(id);
    return result;
  }
  async updateSubRoutine(
    routineId: string,
    updateData: any,
    clientId?: string,
  ) {
    const routine = await this.subRoutineRepository.findById(routineId);

    if (!routine) {
      throw new Error("Routine not found");
    }

    if (!routine.isCustom && clientId) {
      routine.isCustom = true;
      const newRoutine = {
        ...routine.toObject(),
        ...updateData,
        isCustom: false,
      };

      return await this.subRoutineRepository.createRoutine(newRoutine);

      //TODO: // Asignar la nueva rutina al cliente
      // await this.clientRepository.addRoutineToClient(
      //   clientId,
      //   savedRoutine._id,
      // ); // Check if this will be in the frontend
    } else {
      return this.subRoutineRepository.updateSubRoutine(routineId, updateData);
    }
  }

  async getSubRoutineById(id: string) {
    return await this.subRoutineRepository.findById(id);
  }

  async getSubRoutines(
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
      this.subRoutineRepository.getSubRoutines(offset, limit, filters),
      this.subRoutineRepository.countSubRoutines(filters),
    ]);
    return { data, total, page, limit };
  }

  async deleteExercise(id: string): Promise<string> {
    try {
      const wasRemoved = await this.exerciseRepository.remove(id);
      const exercisesRemovedFromSubRoutines =
        await this.subRoutineRepository.removeExerciseFromSubRoutines(id);

      if (wasRemoved && exercisesRemovedFromSubRoutines) {
        return "Exerscise removed successfully";
      } else if (wasRemoved) {
        throw "Error when trying to remove exercise from subroutines";
      } else {
        throw "Exercise not found";
      }
    } catch (error: any) {
      throw new Error(`Error when trying to delete exercise: ${error.message}`);
    }
  }
}

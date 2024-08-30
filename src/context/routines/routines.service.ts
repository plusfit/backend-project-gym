import {
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { EXERCISE_REPOSITORY } from "@/src/context/exercises/repositories/exercise.repository";
import { CreateRoutineDto } from "@/src/context/routines/dto/create-routine.dto";
import { ROUTINE_REPOSITORY } from "@/src/context/routines/repositories/mongo-routine.repository";

@Injectable()
export class RoutinesService {
  constructor(
    @Inject(ROUTINE_REPOSITORY)
    private readonly routineRepository: any,
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: any,
    // private readonly clientRepository: ClientRepository, //TODO: Agregar el repositorio de clientes
  ) {}

  async createRoutine(createRoutineDto: CreateRoutineDto) {
    for (const exerciseId of createRoutineDto.exercises) {
      if (!exerciseId) {
        throw new HttpException("Exercise ID is required", 500);
      }
      const exerciseExists = await this.exerciseRepository.findOne(exerciseId);
      if (!exerciseExists) {
        throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
      }
    }
    return this.routineRepository.createRoutine(createRoutineDto);
  }

  async deleteRoutine(id: string) {
    const routine = await this.routineRepository.findById(id);
    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }
    return this.routineRepository.deleteRoutine(id);
  }
  async updateRoutine(routineId: string, updateData: any, clientId?: string) {
    const routine = await this.routineRepository.findById(routineId);

    if (!routine) {
      throw new Error("Routine not found");
    }
    //
    if (!routine.isCustom && clientId) {
      routine.isCustom = true;
      const newRoutine = {
        ...routine.toObject(),
        ...updateData,
        isCustom: false,
      };

      return await this.routineRepository.createRoutine(newRoutine);

      //TODO: // Asignar la nueva rutina al cliente
      // await this.clientRepository.addRoutineToClient(
      //   clientId,
      //   savedRoutine._id,
      // ); // Check if this will be in the frontend
    } else {
      return this.routineRepository.updateRoutine(routineId, updateData);
    }
  }

  findOne(id: string) {
    return this.exerciseRepository.findOne(id);
  }

  async getRoutines(
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
      this.routineRepository.getRoutines(offset, limit, filters),
      this.routineRepository.countRoutines(filters),
    ]);
    return { data, total, page, limit };
  }
}

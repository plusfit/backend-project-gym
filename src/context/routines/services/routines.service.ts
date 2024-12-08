import {
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";
import { CreateRoutineDto } from "@/src/context/routines/dto/create-routine.dto";
import {
  ROUTINE_REPOSITORY,
  SUB_ROUTINE_REPOSITORY,
} from "@/src/context/routines/repositories/mongo-sub-routine.repository";

@Injectable()
export class RoutinesService {
  constructor(
    @Inject(SUB_ROUTINE_REPOSITORY)
    private readonly subRoutineRepository: any,
    @Inject(ROUTINE_REPOSITORY)
    private readonly routineRepository: any,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: any,
  ) {}

  async createRoutine(createRoutineDto: CreateRoutineDto) {
    for (const subRoutineDetail of createRoutineDto.subRoutines) {
      if (!subRoutineDetail.subRoutine) {
        throw new HttpException("Subroutine ID is required", 500);
      }
      const subRoutineExist = await this.subRoutineRepository.findById(
        subRoutineDetail.subRoutine,
      );
      if (!subRoutineExist) {
        throw new NotFoundException(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Subroutine with ID ${subRoutineDetail.subRoutine} not found`,
        );
      }
    }
    return this.routineRepository.createRoutine(createRoutineDto);
  }

  async deleteRoutine(id: string) {
    const routine = await this.getRoutineById(id);

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

    if (!routine.isCustom && clientId) {
      routine.isCustom = true;
      const newRoutineObj = {
        ...routine.toObject(),
        ...updateData,
        isCustom: false,
      };

      const newRoutine =
        await this.routineRepository.createRoutine(newRoutineObj);

      //TODO: // Asignar la nueva rutina al cliente
      //LLamar al client service y asignar la rutina al mismo
      return this.clientRepository.assignRoutineToClient(
        clientId,
        newRoutine._id,
      );
    } else {
      return this.routineRepository.updateRoutine(routineId, updateData);
    }
  }

  async getRoutineById(id: string) {
    try {
      const routine = await this.routineRepository.findById(id);
      if (!routine) {
        throw new NotFoundException(`Routine with ID ${id} not found`);
      }
      return routine;
    } catch {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }
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

    return { data: data, total, page, limit };
  }
}

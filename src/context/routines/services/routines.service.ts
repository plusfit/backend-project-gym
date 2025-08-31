import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";
import { Client } from "@/src/context/clients/schemas/client.schema";
import { PLAN_REPOSITORY } from "@/src/context/plans/repositories/plans.repository";
import { Plan } from "@/src/context/plans/schemas/plan.schema";
import { CreateRoutineDto } from "@/src/context/routines/dto/create-routine.dto";
import {
  ROUTINE_REPOSITORY,
  SUB_ROUTINE_REPOSITORY,
} from "@/src/context/routines/repositories/mongo-sub-routine.repository";
import { Routine } from "@/src/context/routines/schemas/routine.schema";

interface ISubRoutineRepository {
  findById(id: string): Promise<any>;
}

interface IRoutineRepository {
  findById(id: string): Promise<Routine | null>;
  createRoutine(data: any): Promise<Routine>;
  deleteRoutine(id: string): Promise<Routine | null>;
  updateRoutine(id: string, updateData: any): Promise<Routine | null>;
  getRoutinesBySubRoutine(subRoutineId: string): Promise<Routine[]>;
  getRoutines(offset: number, limit: number, filters: any): Promise<Routine[]>;
  countRoutines(filters: any): Promise<number>;
}

interface IClientRepository {
  getClientById(id: string): Promise<Client | null>;
  assignRoutineToClient(clientId: string, routineId: string): Promise<Client>;
}

interface IPlanRepository {
  findOne(id: string): Promise<Plan | null>;
}

@Injectable()
export class RoutinesService {
  constructor(
    @Inject(SUB_ROUTINE_REPOSITORY)
    private readonly subRoutineRepository: ISubRoutineRepository,
    @Inject(ROUTINE_REPOSITORY)
    private readonly routineRepository: IRoutineRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(PLAN_REPOSITORY)
    private readonly planRepository: IPlanRepository,
  ) {}

  async createRoutine(createRoutineDto: CreateRoutineDto): Promise<Routine> {
    // Validar que las subrutinas existan
    for (const id of createRoutineDto.subRoutines) {
      if (!id) {
        throw new HttpException(
          "Subroutine ID is required",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const subRoutineExist = await this.subRoutineRepository.findById(id);
      if (!subRoutineExist) {
        throw new NotFoundException(`Subroutine with ID ${id} not found`);
      }
    }

    if (createRoutineDto.showOnScreen === true) {
      await this.validateShowOnScreenLimit();
    }

    return this.routineRepository.createRoutine(createRoutineDto);
  }

  async deleteRoutine(id: string): Promise<Routine | null> {
    const routine = await this.getRoutineById(id);
    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }
    return this.routineRepository.deleteRoutine(id);
  }

  async updateRoutine(
    routineId: string,
    updateData: any,
    clientId?: string,
  ): Promise<Routine | Client> {
    const routine = await this.routineRepository.findById(routineId);
    if (!routine) {
      throw new NotFoundException("Routine not found");
    }

    if (!routine.isCustom && clientId) {
      const updatedRoutineData = {
        ...routine.toObject(),
        ...updateData,
        isCustom: true,
      };

      if (updatedRoutineData.showOnScreen === true) {
        await this.validateShowOnScreenLimit();
      }

      const client = await this.clientRepository.getClientById(clientId);
      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }

      const plan = await this.planRepository.findOne(client.planId);
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${client.planId} not found`);
      }

      if (plan.days < updatedRoutineData.subRoutines.length) {
        throw new HttpException(
          "The number of days in the plan must be greater than or equal to the number of subroutines in the routine",
          HttpStatus.BAD_REQUEST,
        );
      }

      const newRoutine: Routine =
        await this.routineRepository.createRoutine(updatedRoutineData);
      if (!newRoutine) {
        throw new HttpException(
          "Error creating new routine",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return this.clientRepository.assignRoutineToClient(
        clientId,
        newRoutine._id as string,
      );
    }

    if (updateData.showOnScreen === true && routine.showOnScreen !== true) {
      await this.validateShowOnScreenLimit();
    }

    return this.routineRepository.updateRoutine(
      routineId,
      updateData,
    ) as Promise<Routine>;
  }

  async getRoutineById(id: string): Promise<Routine> {
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

  async getRoutinesBySubRoutine(subRoutineId: string): Promise<Routine[]> {
    try {
      return await this.routineRepository.getRoutinesBySubRoutine(subRoutineId);
    } catch (error: any) {
      throw new HttpException(
        `Error getting routines by subroutine: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRoutines(
    page: number,
    limit: number,
    name?: string,
    type?: string,
    mode?: string,
    isGeneral?: boolean,
    showOnScreen?: boolean,
  ): Promise<{
    data: Routine[];
    total: number;
    page: number;
    limit: number;
    isGeneral?: boolean;
  }> {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (isGeneral !== undefined) {
      filters.isGeneral = isGeneral;
    }

    if (showOnScreen !== undefined) {
      filters.showOnScreen = showOnScreen;
    }

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

  private async validateShowOnScreenLimit(): Promise<void> {
    const currentScreenRoutines = await this.routineRepository.countRoutines({
      showOnScreen: true,
    });

    if (currentScreenRoutines >= 3) {
      throw new HttpException(
        "No se pueden tener más de 3 rutinas visibles en pantalla",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

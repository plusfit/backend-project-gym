import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";

import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { CLIENT_REPOSITORY } from "./repositories/clients.repository";
import { Client } from "@/src/context/clients/schemas/client.schema";
import { PlansService } from "@/src/context/plans/plans.service";
import { Plan } from "@/src/context/plans/schemas/plan.schema";
import { Routine } from "@/src/context/routines/schemas/routine.schema";
import { RoutinesService } from "@/src/context/routines/services/routines.service";

import { CreateClientDto } from "./dto/create-client.dto";
import { ClientFilters } from "./interfaces/clients.interface";
import { SchedulesService } from "../schedules/schedules.service";
import { EntityId } from "../shared/entities/tenant-base.entity";

interface IClientsRepository {
  getClientById(id: string): Promise<Client | null>;
  getClients(
    offset: number,
    limit: number,
    filters: { name?: string; email?: string },
  ): Promise<Client[]>;
  createClient(client: Client): Promise<Client | null>;
  updateClient(id: string, client: Client): Promise<Client | null>;
  removeClient(id: string): Promise<boolean>;
  findClientByEmail(email: string): Promise<Client | null>;
  countClients(filters: { name?: string; type?: string }): Promise<number>;
  findClientById(id: string): Promise<Client | null>;
  assignRoutineToClient(
    clientId: string,
    routineId: string,
  ): Promise<Client | null>;
  assignPlanToClient(
    clientId: string,
    planId: EntityId,
  ): Promise<Client | null>;
  getListClients(ids: string[]): Promise<Client[]>;
  findClientsByPlanId(planId: string): Promise<Client[]>;
  toggleDisabled(id: string, disabled: boolean): Promise<Client | null>;
  removeRoutineFromClient(clientId: string): Promise<Client | null>;
  findClientsByRoutineId(routineId: string): Promise<Client[]>;
  getClientsWithRoutines(): Promise<Client[]>;
  getClientsWithoutRoutines(): Promise<Client[]>;
}

@Injectable()
export class ClientsService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientsRepository: IClientsRepository,
    @Inject(forwardRef(() => PlansService))
    private readonly plansService: PlansService,
    @Inject(forwardRef(() => SchedulesService))
    private readonly schedulesService: SchedulesService,
    @Inject(forwardRef(() => RoutinesService))
    private readonly routinesService: RoutinesService,
  ) {}

  addFilter(field: string, value: any, target: any) {
    if (typeof value === "string" && value.trim() !== "") {
      target.$or.push({ [field]: { $regex: value, $options: "i" } });
    } else if (value) {
      target.$or.push({ [field]: value });
    }
  }

  async findAll(page: number, limit: number, clientFilters: ClientFilters) {
    const offset = (page - 1) * limit;
    const { name, email, CI, role, withoutPlan, disabled } = clientFilters;
    let filters: any = { $or: [] };

    if (role) {
      filters.role = role;
    }

    if (name || email || CI) {
      filters.$or = [];

      this.addFilter("userInfo.name", name, filters);
      this.addFilter("email", email, filters);
      this.addFilter("userInfo.CI", CI, filters);
    }

    if (withoutPlan) {
      filters.planId = { $in: [undefined, undefined, ""] }; // null, undefined o vacío
    }

    if (disabled !== undefined) {
      filters.disabled = disabled;
    }

    if (filters.$or && filters.$or.length === 0) {
      const { $or, ...filtersWithoutOr } = filters;
      filters = filtersWithoutOr;
    }

    const [data, total] = await Promise.all([
      this.clientsRepository.getClients(offset, limit, filters),
      this.clientsRepository.countClients(filters),
    ]);

    return { data, total, page, limit };
  }

  async getListClients(ids: string[]) {
    try {
      // Inicializamos un array vacío para almacenar los clientes obtenidos
      const clients = [];

      // Iteramos sobre los IDs de los clientes
      for (const id of ids) {
        // Esperamos a obtener el cliente de la base de datos
        const client = await this.clientsRepository.getClientById(id);

        // Si el cliente existe, lo agregamos al array
        if (client) {
          clients.push(client);
        }
      }

      // Devolvemos el array de clientes obtenidos
      return clients;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error al obtener los clientes:", error);
      throw new Error("Error al obtener los clientes");
    }
  }

  findOne(id: string) {
    return this.clientsRepository.getClientById(id);
  }

  create(createClientDto: CreateClientDto) {
    return this.clientsRepository.createClient(createClientDto as Client);
  }

  update(id: string, updateClientDto: UpdateClientDto) {
    updateClientDto.isOnboardingCompleted = true;
    return this.clientsRepository.updateClient(id, updateClientDto as Client);
  }

  async remove(id: string) {
    return this.clientsRepository.removeClient(id);
  }

  async assignRoutineToClient(clientId: string, routineId: string) {
    const client: Client | null =
      await this.clientsRepository.getClientById(clientId);
    if (!client) {
      throw new NotFoundException("Client not found");
    }

    const routine: Routine | null =
      await this.routinesService.getRoutineById(routineId);
    if (!routine) {
      throw new NotFoundException("Routine not found");
    }

    if (!client.planId) {
      throw new NotFoundException(
        `Client ${clientId} does not have a plan assigned`,
      );
    }

    const plan: Plan = await this.plansService.findOne(
      client.planId.toString(),
    );
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${client.planId} not found`);
    }

    if (plan.days < routine.subRoutines.length) {
      throw new HttpException(
        "The number of days in the plan must be greater than or equal to the number of subroutines in the routine",
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.clientsRepository.assignRoutineToClient(
      clientId,
      routineId,
    );
  }

  async assignPlanToClient(clientId: string, planId: string) {
    try {
      return await this.clientsRepository.assignPlanToClient(clientId, planId);
    } catch (error: any) {
      throw new HttpException(
        `Error al asignar el plan al cliente: ${error.message}`,
        error.status || 500,
      );
    }
  }

  async findClientsByPlanId(planId: string) {
    try {
      return await this.clientsRepository.findClientsByPlanId(planId);
    } catch (error: any) {
      throw new HttpException(
        `Error al obtener los clientes por plan: ${error.message}`,
        error.status || 500,
      );
    }
  }

  async updateUserInfo(clientId: string, userInfo: any) {
    try {
      const client = await this.findOne(clientId);
      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }

      // Merge existing userInfo with new userInfo
      const updatedUserInfo = { ...userInfo };

      // Update client with new userInfo
      console.log("updatedUserInfo", updatedUserInfo);
      return this.update(clientId, { userInfo: updatedUserInfo });
    } catch (error: any) {
      throw new HttpException(
        `Error updating client userInfo: ${error.message}`,
        error.status || 500,
      );
    }
  }

  async toggleDisabled(clientId: string, disabled: boolean) {
    try {
      if (disabled) {
        const schedules = await this.schedulesService.getAllSchedules();

        // Filtrar y actualizar solo los horarios que tengan al cliente
        const updates = schedules
          .filter((schedule: any) => schedule.clients.includes(clientId))
          .map((schedule: any) => {
            const updatedSchedule = {
              ...schedule.toObject(), // Si es un documento de Mongoose
              clients: schedule.clients.filter((id: string) => id !== clientId),
            };

            return this.schedulesService.updateSchedule(
              schedule._id,
              updatedSchedule,
            );
          });

        await Promise.all(updates);
      }

      const client = await this.clientsRepository.toggleDisabled(
        clientId,
        disabled,
      );
      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }

      return client;
    } catch (error: any) {
      throw new HttpException(
        `Error toggling disabled status for client: ${error.message}`,
        error.status || 500,
      );
    }
  }
}

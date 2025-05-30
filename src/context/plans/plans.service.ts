import { Inject, Injectable } from "@nestjs/common";

import { PlanEntity } from "@/src/context/plans/entities/plan.entity";

import { SCHEDULE_REPOSITORY } from "../schedules/repositories/mongo-schedule.repository";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PLAN_REPOSITORY } from "./repositories/plans.repository";
import { Plan } from "./schemas/plan.schema";

@Injectable()
export class PlansService {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly plansRepository: any,
    @Inject(SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: any,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<PlanEntity> {
    return await this.plansRepository.createPlan(createPlanDto);
  }

  async getPlans(page: number, limit: number, name?: string, type?: string) {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (name) {
      filters.name = name;
    }

    if (type) {
      filters.type = type;
    }

    const [data, total] = await Promise.all([
      this.plansRepository.getPlans(offset, limit, filters),
      this.plansRepository.countPlans(filters),
    ]);
    return { data, total, page, limit };
  }

  findByUserId(userId: string) {
    return this.plansRepository.findByUserId(userId);
  }

  findOne(id: string) {
    return this.plansRepository.findOne(id);
  }

  update(id: string, updatePlanDto: UpdatePlanDto) {
    return this.plansRepository.update(id, updatePlanDto);
  }

  async remove(id: string) {
    const clients = await this.getClientsByPlanId(id);
    if (clients.length > 0) {
      for (const client of clients) {
        await this.updateClientPlan(client._id, "");
      }
    }
    await this.plansRepository.remove(id);
  }

  assignPlanToClient(clientId: string, planId: string | Plan) {
    // Si recibimos un objeto Plan, extraemos su ID
    const finalPlanId =
      typeof planId === "string" ? planId : planId._id?.toString();
    if (!finalPlanId) {
      throw new Error("Plan ID is required");
    }
    return this.plansRepository.assignPlanToClient(clientId, finalPlanId);
  }

  async getClientsWithPlansAndSchedules(filters: any) {
    // Obtener todos los clientes que coincidan con los filtros
    const clients = await this.plansRepository.findAllClients(
      undefined,
      undefined,
      filters,
    );

    const clientsWithDetails = await Promise.all(
      clients.data.map(async (client: any) => {
        const plan = client.planId
          ? await this.plansRepository.findOne(client.planId)
          : undefined;

        const schedules = await this.scheduleRepository.getSchedules();
        const assignedSchedules = schedules.filter((s: any) =>
          s.clients.includes(client._id),
        );

        return {
          ...client,
          plan,
          assignedSchedules,
        };
      }),
    );

    return clientsWithDetails;
  }

  async findAssignableClientsBasedOnPlan(
    page: number,
    limit: number,
    name?: string,
    email?: string,
    CI?: string,
    hourId?: string,
  ) {
    const filters: any = {};
    const offset = (page - 1) * limit;

    if (email) {
      filters.email = { $regex: email, $options: "i" };
    }

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (CI) {
      filters.CI = { $regex: CI, $options: "i" };
    }

    const hour = await this.scheduleRepository.findById(hourId);

    // Obtener todos los clientes con sus planes y schedules (sin paginar aún)
    const clients = await this.getClientsWithPlansAndSchedules(filters);

    // Filtrar clientes asignables
    const assignableClients = clients.filter((client: any) => {
      const planDays = client.plan?.days || 0;
      const assignedDays =
        client.assignedSchedules?.map((s: any) => s.day) || [];
      const hourClients = hour._doc.clients || [];

      return (
        assignedDays.length < planDays &&
        client._doc.role === "User" &&
        client._doc.disabled === false &&
        !hourClients.includes(client._doc._id)
      );
    });

    // **IMPORTANTE:** Obtener el total antes de la paginación
    const total = assignableClients.length;

    // **Verificar si el offset es válido** (para evitar errores si se pasa del total)
    if (offset >= total) {
      return { data: [], total, page: Math.floor(offset / limit) + 1, limit };
    }

    // Aplicar paginación manual correctamente
    const paginatedClients = assignableClients.slice(offset, offset + limit);

    return {
      data: paginatedClients.map((client: any) => ({
        _id: client._doc._id,
        name: client._doc.userInfo.name,
        CI: client._doc.userInfo.CI,
        email: client._doc.email,
      })),
      total, // Total de clientes asignables
      page: page, // Página actual
      limit, // Límite por página
    };
  }

  getClientsByPlanId(planId: string) {
    return this.plansRepository.findClientsByPlanId(planId);
  }

  updateClientPlan(clientId: string, planId: string) {
    return this.plansRepository.assignPlanToClient(clientId, planId);
  }

  // Métodos adicionales para el controller
  findClientById(clientId: string) {
    return this.plansRepository.findClientById(clientId);
  }

  updateClientRoutine(clientId: string, routineId: string) {
    return this.plansRepository.updateClientRoutine(clientId, routineId);
  }
}

import { Inject, Injectable } from "@nestjs/common";

import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";
import { PlanEntity } from "@/src/context/plans/entities/plan.entity";

import { SCHEDULE_REPOSITORY } from "../schedules/repositories/mongo-schedule.repository";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PLAN_REPOSITORY } from "./repositories/plans.repository";

@Injectable()
export class PlansService {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly plansRepository: any,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: any,
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
      filters.name = { $regex: name, $options: "i" };
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

  remove(id: string) {
    return this.plansRepository.remove(id);
  }

  assignPlanToClient(clientId: string, planId: string) {
    return this.clientRepository.assignPlanToClient(clientId, planId);
  }

  async getClientsWithPlansAndSchedules(offset: number, limit: number) {
    // Obtener los clientes paginados
    const clients = await this.clientRepository.getClients(offset, limit);

    const clientsWithDetails = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/require-await
      clients.map(async (client: any) => {
        // Obtener el plan del cliente basado en su planId
        const plan = client.planId
          ? await this.plansRepository.findOne(client.planId)
          : undefined;

        // Obtener los días asignados en los schedules
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

  async findAssignableClientsBasedOnPlan(offset: number, limit: number) {
    const clients = await this.getClientsWithPlansAndSchedules(offset, limit);

    return clients.filter((client: any) => {
      // Días definidos en el plan
      const planDays = client.plan?.days || [];
      // Días asignados al cliente en los schedules
      const assignedDays =
        client.assignedSchedules?.map((s: any) => s.day) || [];

      // Si la cantidad de días asignados es menor que los días del plan, el cliente es asignable
      return assignedDays.length < planDays.length;
    });
  }
}

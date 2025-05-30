import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { CreatePlanDto } from "../dto/create-plan.dto";
import { UpdatePlanDto } from "../dto/update-plan.dto";
import { Plan, PlanDocument } from "../schemas/plan.schema";
import { PlanRepository } from "./plans.repository";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";
import { Client, ClientDocument } from "../../clients/schemas/client.schema";
import {
  Schedule,
  ScheduleDocument,
} from "../../schedules/schemas/schedule.schema";

@Injectable()
export class MongoPlansRepository implements PlanRepository {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async createPlan(plan: CreatePlanDto): Promise<Plan> {
    const tenantData = {
      ...plan,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    return await this.planModel.create(tenantData);
  }

  async getPlans(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string } = {},
  ): Promise<Plan[]> {
    const filter: any = {};
    if (filters.name) {
      filter.name = { $regex: filters.name, $options: "i" };
    }
    if (filters.type) {
      filter.type = filters.type;
    }

    return await this.planModel
      .find(this.addTenantFilter(filter))
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countPlans(filters: any = {}): Promise<number> {
    const filter: any = {};
    if (filters.name) {
      filter.name = { $regex: filters.name, $options: "i" };
    }
    if (filters.type) {
      filter.type = filters.type;
    }
    return await this.planModel
      .countDocuments(this.addTenantFilter(filter))
      .exec();
  }

  async findOne(id: string): Promise<Plan | null> {
    return await this.planModel
      .findOne(this.addTenantFilter({ _id: id }))
      .populate("defaultRoutine")
      .exec();
  }

  async update(id: string, plan: UpdatePlanDto): Promise<Plan | null> {
    try {
      return await this.planModel
        .findOneAndUpdate(this.addTenantFilter({ _id: id }), plan, {
          new: true,
        })
        .exec();
    } catch (error: any) {
      throw new Error(`Error updating plan with id ${id}, ${error.message}`);
    }
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.planModel
      .deleteOne(this.addTenantFilter({ _id: id }))
      .exec();
    return result.deletedCount > 0;
  }

  async getPlanByMode(mode: string): Promise<Plan | null> {
    return await this.planModel.findOne(this.addTenantFilter({ mode })).exec();
  }

  async getClientsWithPlansAndSchedules(): Promise<any[]> {
    // Este método necesitaría implementación específica
    // Por ahora retorno un array vacío
    return [];
  }

  async findAssignableClientsBasedOnPlan(): Promise<any[]> {
    // Este método necesitaría implementación específica
    // Por ahora retorno un array vacío
    return [];
  }

  // Métodos para eliminar dependencias circulares
  async findClientsByPlanId(planId: string): Promise<Client[]> {
    return this.clientModel
      .find(this.addTenantFilter({ planId: new Types.ObjectId(planId) }))
      .exec();
  }

  async assignPlanToClient(
    clientId: string,
    planId: string,
  ): Promise<Client | null> {
    const planObjectId =
      typeof planId === "string" ? new Types.ObjectId(planId) : planId;

    return this.clientModel
      .findOneAndUpdate(
        this.addTenantFilter({ _id: clientId }),
        { planId: planObjectId },
        { new: true },
      )
      .exec();
  }

  async findAllClients(
    page = 1,
    limit = 10,
    filters: any = {},
  ): Promise<{ data: Client[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const filter: any = {};

    if (filters.name) {
      filter["userInfo.name"] = { $regex: filters.name, $options: "i" };
    }
    if (filters.email) {
      filter.email = { $regex: filters.email, $options: "i" };
    }

    const [data, total] = await Promise.all([
      this.clientModel
        .find(this.addTenantFilter(filter))
        .skip(offset)
        .limit(limit)
        .exec(),
      this.clientModel.countDocuments(this.addTenantFilter(filter)).exec(),
    ]);

    return { data, total, page, limit };
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return this.scheduleModel.find(this.addTenantFilter()).exec();
  }

  async findByUserId(userId: string): Promise<Plan | null> {
    return this.planModel.findOne(this.addTenantFilter({ userId })).exec();
  }

  async findClientById(clientId: string): Promise<Client | null> {
    return this.clientModel
      .findOne(this.addTenantFilter({ _id: clientId }))
      .exec();
  }

  async updateClientRoutine(
    clientId: string,
    routineId: string,
  ): Promise<Client | null> {
    return this.clientModel
      .findOneAndUpdate(
        this.addTenantFilter({ _id: clientId }),
        { routineId: new Types.ObjectId(routineId) },
        { new: true },
      )
      .exec();
  }
}

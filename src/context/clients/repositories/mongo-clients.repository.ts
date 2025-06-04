import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { ClientsRepository } from "@/src/context/clients/repositories/clients.repository";
import {
  Client,
  ClientDocument,
} from "@/src/context/clients/schemas/client.schema";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";
import { Plan, PlanDocument } from "../../plans/schemas/plan.schema";
import {
  Schedule,
  ScheduleDocument,
} from "../../schedules/schemas/schedule.schema";
import {
  Routine,
  RoutineDocument,
} from "../../routines/schemas/routine.schema";

@Injectable()
export class MongoClientsRepository implements ClientsRepository {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(Routine.name) private routineModel: Model<RoutineDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async getClientById(id: string): Promise<Client | null> {
    return this.clientModel.findOne(this.addTenantFilter({ _id: id })).exec();
  }

  async getClients(
    offset: number,
    limit: number,
    filters: { name?: string; email?: string },
  ): Promise<Client[]> {
    const filter: any = {};
    if (filters.name) {
      filter["userInfo.name"] = { $regex: filters.name, $options: "i" };
    }
    if (filters.email) {
      filter.email = { $regex: filters.email, $options: "i" };
    }

    return this.clientModel
      .find(this.addTenantFilter(filter))
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async createClient(client: Client): Promise<Client | null> {
    const tenantData = {
      ...client,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    const newClient = new this.clientModel(tenantData);
    return newClient.save();
  }

  async updateClient(id: string, client: Client): Promise<Client | null> {
    return this.clientModel
      .findOneAndUpdate(this.addTenantFilter({ _id: id }), client, {
        new: true,
      })
      .exec();
  }

  async removeClient(id: string): Promise<boolean> {
    const result = await this.clientModel
      .deleteOne(this.addTenantFilter({ _id: id }))
      .exec();
    return result.deletedCount > 0;
  }

  async findClientByEmail(email: string): Promise<Client | null> {
    return this.clientModel.findOne(this.addTenantFilter({ email })).exec();
  }

  async countClients(filters: {
    name?: string;
    type?: string;
  }): Promise<number> {
    const filter: any = {};
    if (filters.name) {
      filter["userInfo.name"] = { $regex: filters.name, $options: "i" };
    }
    return this.clientModel.countDocuments(this.addTenantFilter(filter)).exec();
  }

  async findClientById(id: string): Promise<Client | null> {
    return this.clientModel.findOne(this.addTenantFilter({ _id: id })).exec();
  }

  async assignRoutineToClient(
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

  async assignPlanToClient(
    clientId: string,
    planId: string,
  ): Promise<Client | null> {
    const planObjectId = new Types.ObjectId(planId);

    return this.clientModel
      .findOneAndUpdate(
        this.addTenantFilter({ _id: clientId }),
        { planId: planObjectId },
        { new: true },
      )
      .exec();
  }

  async getListClients(ids: string[]): Promise<Client[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.clientModel
      .find(this.addTenantFilter({ _id: { $in: objectIds } }))
      .exec();
  }

  async findClientsByPlanId(planId: string): Promise<Client[]> {
    return this.clientModel
      .find(this.addTenantFilter({ planId: new Types.ObjectId(planId) }))
      .exec();
  }

  async toggleDisabled(id: string, disabled: boolean): Promise<Client | null> {
    return this.clientModel
      .findOneAndUpdate(
        this.addTenantFilter({ _id: id }),
        { disabled },
        { new: true },
      )
      .exec();
  }

  // Funciones específicas para rutinas de clientes
  async removeRoutineFromClient(clientId: string): Promise<Client | null> {
    return this.clientModel
      .findOneAndUpdate(
        this.addTenantFilter({ _id: clientId }),
        { routineId: null },
        { new: true },
      )
      .exec();
  }

  async findClientsByRoutineId(routineId: string): Promise<Client[]> {
    return this.clientModel
      .find(this.addTenantFilter({ routineId: new Types.ObjectId(routineId) }))
      .exec();
  }

  async getClientsWithRoutines(): Promise<Client[]> {
    return this.clientModel
      .find(this.addTenantFilter({ routineId: { $exists: true, $ne: null } }))
      .exec();
  }

  async getClientsWithoutRoutines(): Promise<Client[]> {
    return this.clientModel
      .find(
        this.addTenantFilter({
          $or: [
            { routineId: { $exists: false } },
            { routineId: null },
            { routineId: undefined },
          ],
        }),
      )
      .exec();
  }

  // Método adicional específico de MongoDB
  async findByEmailAndOrganization(
    email: string,
    organizationId: Types.ObjectId,
  ): Promise<ClientDocument | null> {
    return this.clientModel
      .findOne({
        email,
        organizationId,
      })
      .exec();
  }

  // Métodos para eliminar dependencias circulares
  async getPlanById(planId: string): Promise<Plan | null> {
    return this.planModel.findOne(this.addTenantFilter({ _id: planId })).exec();
  }

  async getRoutineById(routineId: string): Promise<Routine | null> {
    return this.routineModel
      .findOne(this.addTenantFilter({ _id: routineId }))
      .exec();
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return this.scheduleModel.find(this.addTenantFilter()).exec();
  }

  async updateSchedule(
    scheduleId: string,
    updateData: any,
  ): Promise<Schedule | null> {
    return this.scheduleModel
      .findOneAndUpdate(this.addTenantFilter({ _id: scheduleId }), updateData, {
        new: true,
      })
      .exec();
  }

  // Método seguro para SuperAdmin: obtiene clientes por organizationId sin tenant context
  async getClientsByOrganizationId(organizationId: string): Promise<Client[]> {
    return await this.clientModel
      .find({ organizationId: new Types.ObjectId(organizationId) })
      .exec();
  }
}

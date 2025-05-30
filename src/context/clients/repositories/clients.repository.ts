import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Client, ClientDocument } from "../schemas/client.schema";
import { TenantBaseRepository } from "@/src/context/shared/repositories/tenant-base.repository";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";
import { Plan } from "../../plans/schemas/plan.schema";

export const CLIENT_REPOSITORY = "ClientsRepository";

export interface ClientsRepositoryInterface {
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
  assignPlanToClient(clientId: string, planId: Plan): Promise<Client | null>;
  getListClients(ids: string[]): Promise<Client[]>;
  findClientsByPlanId(planId: string): Promise<Client[]>;
  toggleDisabled(id: string, disabled: boolean): Promise<Client | null>;
}

@Injectable()
export class ClientsRepository
  extends TenantBaseRepository<ClientDocument>
  implements ClientsRepositoryInterface
{
  constructor(
    @InjectModel(Client.name) clientModel: Model<ClientDocument>,
    tenantContext: TenantContextService,
  ) {
    super(clientModel, tenantContext);
  }

  async getClientById(id: string): Promise<Client | null> {
    return this.findById(id);
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

    return this.model
      .find(this.addTenantFilter(filter))
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async createClient(client: Client): Promise<Client | null> {
    return this.create(client);
  }

  async updateClient(id: string, client: Client): Promise<Client | null> {
    return this.update(id, client);
  }

  async removeClient(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async findClientByEmail(email: string): Promise<Client | null> {
    return this.findOne({ email });
  }

  async countClients(filters: {
    name?: string;
    type?: string;
  }): Promise<number> {
    const filter: any = {};
    if (filters.name) {
      filter["userInfo.name"] = { $regex: filters.name, $options: "i" };
    }
    return this.count(filter);
  }

  async findClientById(id: string): Promise<Client | null> {
    return this.findById(id);
  }

  async assignRoutineToClient(
    clientId: string,
    routineId: string,
  ): Promise<Client | null> {
    return this.update(clientId, {
      routineId: new Types.ObjectId(routineId),
    } as any);
  }

  async assignPlanToClient(
    clientId: string,
    planId: Plan,
  ): Promise<Client | null> {
    return this.update(clientId, { planId: planId._id } as any);
  }

  async getListClients(ids: string[]): Promise<Client[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.findAll({ _id: { $in: objectIds } });
  }

  async findClientsByPlanId(planId: string): Promise<Client[]> {
    return this.findAll({ planId: new Types.ObjectId(planId) });
  }

  async toggleDisabled(id: string, disabled: boolean): Promise<Client | null> {
    return this.update(id, { disabled } as any);
  }

  async findByEmailAndOrganization(
    email: string,
    organizationId: Types.ObjectId,
  ): Promise<ClientDocument | null> {
    return this.model
      .findOne({
        email,
        organizationId,
      })
      .exec();
  }
}

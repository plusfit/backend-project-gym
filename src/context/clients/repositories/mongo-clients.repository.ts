import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { ClientsRepository } from "@/src/context/clients/repositories/clients.repository";
import {
  Client,
  ClientDocument,
} from "@/src/context/clients/schemas/client.schema";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";
import { Plan } from "../../plans/schemas/plan.schema";

@Injectable()
export class MongoClientsRepository extends ClientsRepository {
  constructor(
    @InjectModel(Client.name) clientModel: Model<ClientDocument>,
    tenantContext: TenantContextService,
  ) {
    super(clientModel, tenantContext);
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
    return this.update(clientId, {
      planId: planId._id,
      routineId: planId.defaultRoutine
        ? new Types.ObjectId(planId.defaultRoutine)
        : undefined,
    } as any);
  }
}

import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { ClientsRepository } from "@/src/context/clients/repositories/clients.repository";
import { Client } from "@/src/context/clients/schemas/client.schema";

export class MongoClientsRepository implements ClientsRepository {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
  ) {}
  async getClientById(id: string): Promise<Client | null> {
    return await this.clientModel.findById(id).exec();
  }

  async getClients(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string },
  ): Promise<Client[]> {
    return await this.clientModel
      .find(filters)
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async createClient(client: Client): Promise<Client> {
    return await this.clientModel.create(client);
  }

  async updateClient(client: Client): Promise<Client | null> {
    return await this.clientModel
      .findByIdAndUpdate(client._id, client, { new: true })
      .exec();
  }

  async countClients(filters: any = {}): Promise<number> {
    return await this.clientModel.countDocuments(filters).exec();
  }
}

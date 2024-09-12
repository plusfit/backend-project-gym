import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AuthRepository } from "@/src/context/auth/repositories/auth.repository";
import { Client } from "@/src/context/clients/schemas/client.schema";

export class MongoAuthRepository implements AuthRepository {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
  ) {}

  async register(registerDto: RegisterAuthDto): Promise<Client> {
    try {
      return await this.clientModel.create(registerDto);
    } catch (error: any) {
      throw new Error(`Error creating client: ${error.message}`);
    }
  }

  async login(email: string): Promise<Client> {
    const client = await this.clientModel.findOne({ email });

    if (!client) {
      throw new Error("Client not found");
    }

    return client;
  }
}

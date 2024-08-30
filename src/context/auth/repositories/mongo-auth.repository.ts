import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { Auth } from "@/src/context/auth/entities/auth.entity";
import { AuthRepository } from "@/src/context/auth/repositories/auth.repository";
import { Client } from "@/src/context/clients/entities/client.entity";

export class MongoAuthRepository implements AuthRepository {
  constructor(
    @InjectModel(Auth.name) private readonly authModel: Model<Auth>,
  ) {}
  register(registerDto: RegisterAuthDto): Promise<Auth> {
    console.log(registerDto);
    return Promise.resolve(
      new Auth({ name: "name", email: "email", token: "token" }),
    );
  }
  login(email: string): Promise<Client> {
    console.log(email);
    return Promise.resolve(new Client());
  }
}

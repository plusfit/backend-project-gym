import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { Auth } from "@/src/context/auth/entities/auth.entity";
import { Client } from "@/src/context/clients/entities/client.entity";

export const AUTH_REPOSITORY = "AuthRepository";
export interface AuthRepository {
  register(registerDto: RegisterAuthDto): Promise<Auth>;

  login(email: string): Promise<Client>;
}

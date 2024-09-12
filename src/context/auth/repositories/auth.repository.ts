import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { Client } from "@/src/context/clients/schemas/client.schema";

export const AUTH_REPOSITORY = "AuthRepository";
export interface AuthRepository {
  register(registerDto: RegisterAuthDto): Promise<Client>;

  login(email: string): Promise<Client>;
}

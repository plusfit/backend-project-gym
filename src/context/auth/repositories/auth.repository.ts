import { InternalRegisterAuthDto } from "@/src/context/auth/dto/internal-register-auth.dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { Client } from "@/src/context/clients/schemas/client.schema";

export const AUTH_REPOSITORY = "AuthRepository";
export abstract class AuthRepository {
	abstract register(registerDto: RegisterAuthDto | InternalRegisterAuthDto): Promise<Client>;

	abstract login(email: string): Promise<Client>;

	abstract saveRefreshToken(userId: string, refreshToken: string): Promise<void>;

	abstract getRefreshToken(userId: string): Promise<string>;

	abstract updateUserInfo(userId: string, userInfo: any): Promise<any>;

	abstract updatePassword(userId: string, hashedPassword: string): Promise<void>;

	abstract updatePlainPassword(userId: string, plainPassword: string): Promise<void>;
}

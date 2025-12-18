import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { InternalRegisterAuthDto } from "@/src/context/auth/dto/internal-register-auth.dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AuthRepository } from "@/src/context/auth/repositories/auth.repository";
import { Client } from "@/src/context/clients/schemas/client.schema";

export class MongoAuthRepository implements AuthRepository {
	constructor(
		@InjectModel(Client.name) private readonly clientModel: Model<Client>,
	) { }
	async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
		await this.clientModel.updateOne(
			{ _id: userId },
			{ $set: { refreshToken } },
		);
	}
	async getRefreshToken(userId: string): Promise<string> {
		const user = await this.clientModel
			.findById(userId)
			.select("refreshToken")
			.exec();
		return user?.refreshToken || "";
	}

	async register(registerDto: RegisterAuthDto | InternalRegisterAuthDto): Promise<Client> {
		try {
			console.log('🗃️ Repository register starting');

			const existingClient = await this.clientModel.findOne({ email: registerDto.email });
			if (existingClient) {
				console.error('❌ Email already exists:', registerDto.email);
				throw new Error(`Email ${registerDto.email} already exists`);
			}

			// Preparar los datos del cliente
			const clientData: any = { email: registerDto.email };

			// Si se proporciona una contraseña, incluirla
			if ('password' in registerDto && registerDto.password) {
				clientData.password = registerDto.password;
			}

			// Si se proporciona una contraseña en texto plano, incluirla
			if ('plainPassword' in registerDto && (registerDto as any).plainPassword) {
				clientData.plainPassword = (registerDto as any).plainPassword;

			}


			const result = await this.clientModel.create(clientData);

			return result;
		} catch (error: any) {

			if (error.code === 11000) {
				console.error('🔄 Duplicate key error details:', error.keyValue);
			}

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

	async updateUserInfo(userId: string, userInfo: any): Promise<Client> {
		try {
			const updatedClient = await this.clientModel.findByIdAndUpdate(
				userId,
				{ $set: { userInfo } },
				{ new: true }
			).exec();

			if (!updatedClient) {
				throw new Error(`User with ID ${userId} not found`);
			}

			return updatedClient;
		} catch (error: any) {
			throw new Error(`Error updating user info: ${error.message}`);
		}
	}

	async updatePassword(userId: string, hashedPassword: string): Promise<void> {
		try {
			const result = await this.clientModel.updateOne(
				{ _id: userId },
				{ $set: { password: hashedPassword } }
			);

			if (result.matchedCount === 0) {
				throw new Error(`User with ID ${userId} not found`);
			}
		} catch (error: any) {
			throw new Error(`Error updating password: ${error.message}`);
		}
	}

	async updatePlainPassword(userId: string, plainPassword: string): Promise<void> {
		try {
			const result = await this.clientModel.updateOne(
				{ _id: userId },
				{ $set: { plainPassword: plainPassword } }
			);

			if (result.matchedCount === 0) {
				throw new Error(`User with ID ${userId} not found`);
			}
		} catch (error: any) {
			throw new Error(`Error updating plain password: ${error.message}`);
		}
	}
}

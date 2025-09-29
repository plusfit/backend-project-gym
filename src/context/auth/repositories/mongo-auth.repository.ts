import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { InternalRegisterAuthDto } from "@/src/context/auth/dto/internal-register-auth.dto";
import { RegisterAuthDto } from "@/src/context/auth/dto/register-auth.dto";
import { AuthRepository } from "@/src/context/auth/repositories/auth.repository";
import { Client } from "@/src/context/clients/schemas/client.schema";

export class MongoAuthRepository implements AuthRepository {
	constructor(
		@InjectModel(Client.name) private readonly clientModel: Model<Client>,
	) {}
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
			// Solo guardar los campos que necesita la base de datos (email)
			const clientData = { email: registerDto.email };
			return await this.clientModel.create(clientData);
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
}

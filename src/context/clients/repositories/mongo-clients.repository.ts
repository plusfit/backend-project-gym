import { InjectModel } from "@nestjs/mongoose";
import { Error, Model } from "mongoose";

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
		filters: { name?: string; email?: string } = {},
	): Promise<Client[]> {
		try {
			return await this.clientModel
				.find(filters)
				.skip(offset)
				.limit(limit)
				.exec();
		} catch (error: any) {
			throw new Error(`Error fetching clients: ${error.message}`);
		}
	}

	async getListClients(ids: string[]): Promise<Client[]> {
		try {
			// Inicializamos un array vacío para almacenar los clientes obtenidos
			const clients = [];

			// Iteramos sobre los IDs de los clientes
			for (const id of ids) {
				// Esperamos a obtener el cliente de la base de datos
				const client = await this.clientModel.findById(id).exec();

				// Si el cliente existe, lo agregamos al array
				if (client) {
					clients.push(client);
				}
			}

			// Devolvemos el array de clientes obtenidos
			return clients;
		} catch (error: any) {
			throw new Error(`Error getting clients: ${error.message}`);
		}
	}

	async createClient(client: Client): Promise<Client> {
		return await this.clientModel.create(client);
	}

	async updateClient(id: string, client: Client): Promise<Client | null> {
		return await this.clientModel
			.findByIdAndUpdate(id, client, { new: true })
			.exec();
	}

	async countClients(filters: any = {}): Promise<number> {
		return await this.clientModel.countDocuments(filters).exec();
	}

	async removeClient(id: string): Promise<boolean> {
		try {
			await this.clientModel.findByIdAndDelete(id).exec();
			return true;
		} catch (error: any) {
			throw new Error(`Error deleting plan with id ${id}, ${error.message}`);
		}
	}

	async findClientByEmail(email: string): Promise<Client | null> {
		return await this.clientModel.findOne({ email }).exec();
	}

	async findClientById(id: string): Promise<Client | null> {
		return await this.clientModel.findById(id).exec();
	}

	async findClientsByPlanId(planId: string): Promise<Client[]> {
		return await this.clientModel.find({ planId }).exec();
	}

	async assignRoutineToClient(
		clientId: string,
		routineId: string,
	): Promise<Client | null> {
		const client = await this.clientModel.findById(clientId).exec();
		if (!client) {
			throw new Error(`Client with id ${clientId} not found`);
		}
		client.routineId = routineId;
		return await client.save();
	}

	async assignPlanToClient(
		clientId: string,
		planId: string,
	): Promise<Client | null> {
		return this.clientModel.findByIdAndUpdate(
			clientId,
			{ planId: planId },
			{ new: true },
		);
	}
}

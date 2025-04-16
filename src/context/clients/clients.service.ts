import {
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	NotFoundException,
	forwardRef,
} from "@nestjs/common";

import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";
import { Client } from "@/src/context/clients/schemas/client.schema";
import { PlansService } from "@/src/context/plans/plans.service";
import { Plan } from "@/src/context/plans/schemas/plan.schema";
import { Routine } from "@/src/context/routines/schemas/routine.schema";

import { CreateClientDto } from "./dto/create-client.dto";
import { ClientFilters } from "./interfaces/clients.interface";

@Injectable()
export class ClientsService {
	constructor(
		@Inject(CLIENT_REPOSITORY)
		private readonly clientRepository: any,
		@Inject(forwardRef(() => PlansService))
		private readonly plansService: any,
	) {}

	addFilter = (field: string, value: any, target: any) => {
		if (typeof value === "string" && value.trim() !== "") {
			target.$or.push({ [field]: { $regex: value, $options: "i" } });
		} else if (value) {
			target.$or.push({ [field]: value });
		}
	};

	async findAll(page: number, limit: number, clientFilters: ClientFilters) {
		const offset = (page - 1) * limit;
		const { name, email, CI, role, withoutPlan } = clientFilters;
		const filters: any = { $or: [] };

		if (role) {
			filters.role = role;
		}

		if (name || email || CI) {
			filters.$or = [];

			this.addFilter("userInfo.name", name, filters);
			this.addFilter("email", email, filters);
			this.addFilter("userInfo.CI", CI, filters);
		}

		if (withoutPlan) {
			filters.planId = { $in: [undefined, undefined, ""] }; // null, undefined o vacío
		}

		if (filters.$or && filters.$or.length === 0) {
			// check if filters.$or is empty
			filters.$or = undefined;
		}

		const [data, total] = await Promise.all([
			this.clientRepository.getClients(offset, limit, filters),
			this.clientRepository.countClients(filters),
		]);

		return { data, total, page, limit };
	}

	async getListClients(ids: string[]) {
		try {
			// Inicializamos un array vacío para almacenar los clientes obtenidos
			const clients = [];

			// Iteramos sobre los IDs de los clientes
			for (const id of ids) {
				// Esperamos a obtener el cliente de la base de datos
				const client = await this.clientRepository.getClientById(id);

				// Si el cliente existe, lo agregamos al array
				if (client) {
					clients.push(client);
				}
			}

			// Devolvemos el array de clientes obtenidos
			return clients;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error al obtener los clientes:", error);
			throw new Error("Error al obtener los clientes");
		}
	}

	findOne(id: string) {
		return this.clientRepository.getClientById(id);
	}

	create(createClientDto: CreateClientDto) {
		return this.clientRepository.createClient(createClientDto);
	}

	update(id: string, updateClientDto: UpdateClientDto) {
		return this.clientRepository.updateClient(id, updateClientDto);
	}

	async remove(id: string) {
		await this.clientRepository.removeClientFirebase(id);
		return this.clientRepository.removeClient(id);
	}

	async assignRoutineToClient(clientId: string, routineId: string) {
		const client: Client = await this.clientRepository.getClientById(clientId);
		if (!client) {
			throw new NotFoundException("Client not found");
		}

		const routine: Routine =
			await this.clientRepository.getRoutineById(routineId);
		if (!routine) {
			throw new NotFoundException("Routine not found");
		}

		const plan: Plan = await this.plansService.findOne(client.planId);
		if (!plan) {
			throw new NotFoundException(`Plan with ID ${client.planId} not found`);
		}

		if (plan.days < routine.subRoutines.length) {
			throw new HttpException(
				"The number of days in the plan must be greater than or equal to the number of subroutines in the routine",
				HttpStatus.BAD_REQUEST,
			);
		}

		return await this.clientRepository.assignRoutineToClient(
			clientId,
			routineId,
		);
	}

	async assignPlanToClient(clientId: string, planId: Plan) {
		try {
			return await this.clientRepository.assignPlanToClient(clientId, planId);
		} catch (error: any) {
			throw new HttpException(
				`Error al asignar el plan al cliente: ${error.message}`,
				error.status || 500,
			);
		}
	}

	async findClientsByPlanId(planId: string) {
		try {
			return await this.clientRepository.findClientsByPlanId(planId);
		} catch (error: any) {
			throw new HttpException(
				`Error al obtener los clientes por plan: ${error.message}`,
				error.status || 500,
			);
		}
	}

	async updateUserInfo(clientId: string, userInfo: any) {
		try {
			const client = await this.findOne(clientId);
			if (!client) {
				throw new NotFoundException(`Client with ID ${clientId} not found`);
			}

			// Merge existing userInfo with new userInfo
			const updatedUserInfo = { ...userInfo };

			// Update client with new userInfo
			console.log("updatedUserInfo", updatedUserInfo);
			return this.update(clientId, { userInfo: updatedUserInfo });
		} catch (error: any) {
			throw new HttpException(
				`Error updating client userInfo: ${error.message}`,
				error.status || 500,
			);
		}
	}
}

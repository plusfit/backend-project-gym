import { Client } from "@/src/context/clients/schemas/client.schema";
import { Plan } from "../../plans/schemas/plan.schema";

export const CLIENT_REPOSITORY = "ClientsRepository";
export interface ClientsRepository {
	getClientById(id: string): Promise<Client | null>;
	getClients(
		offset: number,
		limit: number,
		filters: { name?: string; email?: string },
	): Promise<Client[]>;
	createClient(client: Client): Promise<Client | null>;
	updateClient(id: string, client: Client): Promise<Client | null>;
	removeClient(id: string): Promise<boolean>;
	findClientByEmail(email: string): Promise<Client | null>;
	countClients(filters: { name?: string; type?: string }): Promise<number>;
	findClientById(id: string): Promise<Client | null>;
	assignRoutineToClient(
		clientId: string,
		routineId: string,
	): Promise<Client | null>;
	assignPlanToClient(clientId: string, planId: Plan): Promise<Client | null>;
	getListClients(ids: string[]): Promise<Client[]>;
	findClientsByPlanId(planId: string): Promise<Client[]>;
}

import { Client } from "@/src/context/clients/schemas/client.schema";

export const CLIENT_REPOSITORY = "ClientsRepository";
export interface ClientsRepository {
  getClientById(id: string): Promise<Client | null>;
  getClients(
    offset: number,
    limit: number,
    filters: { name?: string; type?: string },
  ): Promise<Client[]>;
  createClient(client: Client): Promise<Client | null>;
  updateClient(id: string, client: Client): Promise<Client | null>;
  removeClient(id: string): Promise<boolean>;
  findClientByEmail(email: string): Promise<Client | null>;
  countClients(filters: { name?: string; type?: string }): Promise<number>;
  findClientById(id: string): Promise<Client | null>;
}

import { Client } from "../schemas/client.schema";
import { Plan } from "../../plans/schemas/plan.schema";
import { Schedule } from "../../schedules/schemas/schedule.schema";
import { Routine } from "../../routines/schemas/routine.schema";

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
  assignPlanToClient(clientId: string, planId: string): Promise<Client | null>;
  getListClients(ids: string[]): Promise<Client[]>;
  findClientsByPlanId(planId: string): Promise<Client[]>;
  toggleDisabled(id: string, disabled: boolean): Promise<Client | null>;

  // Funciones específicas para rutinas
  removeRoutineFromClient(clientId: string): Promise<Client | null>;
  findClientsByRoutineId(routineId: string): Promise<Client[]>;
  getClientsWithRoutines(): Promise<Client[]>;
  getClientsWithoutRoutines(): Promise<Client[]>;

  // Métodos para eliminar dependencias circulares
  getPlanById(planId: string): Promise<Plan | null>;
  getRoutineById(routineId: string): Promise<Routine | null>;
  getAllSchedules(): Promise<Schedule[]>;
  updateSchedule(scheduleId: string, updateData: any): Promise<Schedule | null>;
  
  // Método seguro para SuperAdmin: obtiene clientes por organizationId directamente
  getClientsByOrganizationId(organizationId: string): Promise<Client[]>;

  // Método para eliminar cliente de Firebase (opcional - para mantener sincronización)
  removeClientFirebase?(id: string): Promise<boolean>;
}

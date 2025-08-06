import { GymAccess, AccessStats } from "../entities/gym-access.entity";

export interface GymAccessFilters {
	cedula?: string;
	clientName?: string;
	successful?: boolean;
	accessDay?: string;
}

export abstract class GymAccessRepository {
	abstract create(gymAccess: Partial<GymAccess>): Promise<GymAccess>;
	abstract findAll(page: number, limit: number, filters?: GymAccessFilters): Promise<{
		gymAccesses: GymAccess[];
		total: number;
	}>;
	abstract findByCedulaAndDay(cedula: string, accessDay: string): Promise<GymAccess | null>;
	abstract findByClientId(clientId: string, page: number, limit: number): Promise<{
		gymAccesses: GymAccess[];
		total: number;
	}>;
	abstract getStats(): Promise<AccessStats>;
	abstract getAccessesByDateRange(startDate: Date, endDate: Date): Promise<GymAccess[]>;
}
import { GymAccess, AccessStats } from "../entities/gym-access.entity";
import { GetGymAccessHistoryDto } from "../dto/get-gym-access-history.dto";

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
	abstract getStats(filters?: GetGymAccessHistoryDto): Promise<AccessStats>;
	abstract getAccessesByDateRange(startDate: Date, endDate: Date): Promise<GymAccess[]>;
}
import { CreateCheckInDto } from "@/src/context/check-ins/dto/create-check-in.dto";
import { CheckIn } from "@/src/context/check-ins/entities/check-in.entity";
import { Types } from "mongoose";

export const CHECK_IN_REPOSITORY = "CheckInRepository";

export interface CheckInFilters {
	ci?: string;
	startDate?: Date;
	endDate?: Date;
}

export interface CheckInRepository {
	createCheckIn(createCheckInDto: CreateCheckInDto): Promise<CheckIn>;

	getCheckIns(
		offset: number,
		limit: number,
		filters: CheckInFilters,
	): Promise<CheckIn[]>;

	countCheckIns(filters: CheckInFilters): Promise<number>;

	findCheckInById(id: string): Promise<CheckIn | null>;

	getCheckInsByCI(
		ci: string,
		offset: number,
		limit: number,
	): Promise<CheckIn[]>;

	getLastCheckInByCI(ci: string): Promise<CheckIn | null>;

	getCheckInsCountByCI(ci: string): Promise<number>;

	getTodayCheckInByCI(ci: string): Promise<CheckIn | null>;
}

// Exportación por defecto para compatibilidad
export { CheckInRepository as default };
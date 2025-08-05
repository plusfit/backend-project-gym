import { CreateCheckInDto } from "@/src/context/check-ins/dto/create-check-in.dto";
import { CheckIn } from "@/src/context/check-ins/entities/check-in.entity";
import { Types } from "mongoose";

export const CHECK_IN_REPOSITORY = "CheckInRepository";

export interface CheckInFilters {
	clientId?: Types.ObjectId;
	startDate?: Date;
	endDate?: Date;
	organizationId?: string;
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

	getCheckInsByClientId(
		clientId: Types.ObjectId,
		offset: number,
		limit: number,
	): Promise<CheckIn[]>;

	getLastCheckInByClientId(clientId: Types.ObjectId): Promise<CheckIn | null>;

	getCheckInsCountByClientId(clientId: Types.ObjectId): Promise<number>;

	getTodayCheckInByClientId(clientId: Types.ObjectId): Promise<CheckIn | null>;
}

// Exportación por defecto para compatibilidad
export { CheckInRepository as default };
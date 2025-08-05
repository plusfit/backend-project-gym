import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateCheckInDto } from "@/src/context/check-ins/dto/create-check-in.dto";
import { CheckIn } from "@/src/context/check-ins/entities/check-in.entity";
import { CheckInRepository, CheckInFilters } from "@/src/context/check-ins/repositories/check-in.repository";
import { CheckIn as CheckInSchema } from "@/src/context/check-ins/schemas/check-in.schema";

@Injectable()
export class MongoCheckInRepository implements CheckInRepository {
	constructor(
		@InjectModel("CheckIn")
		private readonly checkInModel: Model<CheckInSchema>,
	) {}

	async createCheckIn(createCheckInDto: CreateCheckInDto): Promise<CheckIn> {
		try {
			const checkIn = new this.checkInModel(createCheckInDto);
			const savedCheckIn = await checkIn.save();
			return savedCheckIn.toObject();
		} catch (error: any) {
			throw new Error(`Error creating check-in: ${error.message}`);
		}
	}

	async getCheckIns(
		offset: number,
		limit: number,
		filters: CheckInFilters,
	): Promise<CheckIn[]> {
		try {
			const query = this.buildFilterQuery(filters);
			const checkIns = await this.checkInModel
				.find(query)
				.populate("clientId", "email userInfo.name userInfo.CI")
				.sort({ checkInDate: -1 })
				.skip(offset)
				.limit(limit)
				.exec();
			return checkIns.map(checkIn => checkIn.toObject());
		} catch (error: any) {
			throw new Error(`Error fetching check-ins: ${error.message}`);
		}
	}

	async countCheckIns(filters: CheckInFilters): Promise<number> {
		try {
			const query = this.buildFilterQuery(filters);
			return await this.checkInModel.countDocuments(query).exec();
		} catch (error: any) {
			throw new Error(`Error counting check-ins: ${error.message}`);
		}
	}

	async findCheckInById(id: string): Promise<CheckIn | null> {
		try {
			const checkIn = await this.checkInModel
				.findById(id)
				.populate("clientId", "email userInfo.name userInfo.CI")
				.exec();
			return checkIn ? checkIn.toObject() : null;
		} catch (error: any) {
			throw new Error(`Error finding check-in: ${error.message}`);
		}
	}

	async getCheckInsByClientId(
		clientId: Types.ObjectId,
		offset: number,
		limit: number,
	): Promise<CheckIn[]> {
		try {
			const checkIns = await this.checkInModel
				.find({ clientId })
				.sort({ checkInDate: -1 })
				.skip(offset)
				.limit(limit)
				.exec();
			return checkIns.map(checkIn => checkIn.toObject());
		} catch (error: any) {
			throw new Error(`Error fetching client check-ins: ${error.message}`);
		}
	}

	async getLastCheckInByClientId(clientId: Types.ObjectId): Promise<CheckIn | null> {
		try {
			const checkIn = await this.checkInModel
				.findOne({ clientId })
				.sort({ checkInDate: -1 })
				.exec();
			return checkIn ? checkIn.toObject() : null;
		} catch (error: any) {
			throw new Error(`Error fetching last check-in: ${error.message}`);
		}
	}

	async getCheckInsCountByClientId(clientId: Types.ObjectId): Promise<number> {
		try {
			return await this.checkInModel.countDocuments({ clientId }).exec();
		} catch (error: any) {
			throw new Error(`Error counting client check-ins: ${error.message}`);
		}
	}

	async getTodayCheckInByClientId(clientId: Types.ObjectId): Promise<CheckIn | null> {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const checkIn = await this.checkInModel
				.findOne({
					clientId,
					checkInDate: {
						$gte: today,
						$lt: tomorrow,
					},
				})
				.sort({ checkInDate: -1 })
				.exec();

			return checkIn ? checkIn.toObject() : null;
		} catch (error: any) {
			throw new Error(`Error fetching today's check-in: ${error.message}`);
		}
	}

	private buildFilterQuery(filters: CheckInFilters): any {
		const query: any = {};

		if (filters.clientId) {
			query.clientId = filters.clientId;
		}

		if (filters.startDate || filters.endDate) {
			query.checkInDate = {};
			if (filters.startDate) {
				query.checkInDate.$gte = filters.startDate;
			}
			if (filters.endDate) {
				query.checkInDate.$lte = filters.endDate;
			}
		}

		if (filters.organizationId) {
			query.organizationId = filters.organizationId;
		}

		return query;
	}
}
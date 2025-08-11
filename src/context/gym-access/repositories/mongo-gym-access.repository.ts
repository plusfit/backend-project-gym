import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { GymAccess, AccessStats } from "../entities/gym-access.entity";
import { GymAccessDocument } from "../schemas/gym-access.schema";
import { GymAccessRepository, GymAccessFilters } from "./gym-access.repository";
import { GetGymAccessHistoryDto } from "../dto/get-gym-access-history.dto";

@Injectable()
export class MongoGymAccessRepository extends GymAccessRepository {
	constructor(
		@InjectModel("GymAccess")
		private readonly gymAccessModel: Model<GymAccessDocument>,
	) {
		super();
	}

	async create(gymAccess: Partial<GymAccess>): Promise<GymAccess> {
		const newGymAccess = new this.gymAccessModel(gymAccess);
		const savedGymAccess = await newGymAccess.save();
		return this.mapToEntity(savedGymAccess);
	}

	async findAll(page: number, limit: number, filters?: GymAccessFilters): Promise<{
		gymAccesses: GymAccess[];
		total: number;
	}> {
		const query = this.buildFilterQuery(filters);
		
		const [gymAccesses, total] = await Promise.all([
			this.gymAccessModel
				.find(query)
				.sort({ accessDate: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.exec(),
			this.gymAccessModel.countDocuments(query).exec(),
		]);

		return {
			gymAccesses: gymAccesses.map(this.mapToEntity),
			total,
		};
	}

	async findByCedulaAndDay(cedula: string, accessDay: string): Promise<GymAccess | null> {
		console.log('=== REPOSITORY findByCedulaAndDay ===');
		console.log('Query:', { cedula, accessDay });
		
		const gymAccess = await this.gymAccessModel
			.findOne({ cedula, accessDay })
			.exec();
		
		console.log('Database result:', gymAccess ? {
			id: gymAccess._id,
			cedula: gymAccess.cedula,
			accessDay: gymAccess.accessDay,
			successful: gymAccess.successful,
			clientName: gymAccess.clientName
		} : 'null');
		
		return gymAccess ? this.mapToEntity(gymAccess) : null;
	}

	async findByClientId(clientId: string, page: number, limit: number): Promise<{
		gymAccesses: GymAccess[];
		total: number;
	}> {
		const [gymAccesses, total] = await Promise.all([
			this.gymAccessModel
				.find({ clientId })
				.sort({ accessDate: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.exec(),
			this.gymAccessModel.countDocuments({ clientId }).exec(),
		]);

		return {
			gymAccesses: gymAccesses.map(this.mapToEntity),
			total,
		};
	}

	async getStats(filters?: GetGymAccessHistoryDto): Promise<AccessStats> {
		const today = new Date();
		const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

		// Build base query from filters
		const baseQuery = this.buildStatsFilterQuery(filters);

		// If no filters are applied, show today's stats by default
		const shouldShowTodayByDefault = !filters || (!filters.cedula && !filters.clientName && filters.successful === undefined);
		const defaultQuery = shouldShowTodayByDefault ? { ...baseQuery, accessDay: this.formatDateAsAccessDay(today) } : baseQuery;

		const todayAccessDay = this.formatDateAsAccessDay(today);
		const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
		const currentYear = today.getFullYear();
		
		// Create regex pattern for this month's accessDay (YYYY-MM-*)
		const monthPattern = `^${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

		const [totalAccesses, successfulAccesses, failedAccesses, todayAccesses, monthAccesses, topClients] = await Promise.all([
			// Total accesses with filters
			this.gymAccessModel.countDocuments(defaultQuery).exec(),
			// Successful accesses with filters
			this.gymAccessModel.countDocuments({ ...defaultQuery, successful: true }).exec(),
			// Failed accesses with filters
			this.gymAccessModel.countDocuments({ ...defaultQuery, successful: false }).exec(),
			// Today's accesses (always show for reference)
			this.gymAccessModel.countDocuments({
				accessDay: todayAccessDay,
				successful: true,
			}).exec(),
			// This month's accesses (always show for reference)
			this.gymAccessModel.countDocuments({
				accessDay: { $regex: monthPattern },
				successful: true,
			}).exec(),
			// Top clients with filters applied
			this.gymAccessModel.aggregate([
				{ $match: { ...baseQuery, successful: true } },
				{ $group: { _id: "$cedula", count: { $sum: 1 }, clientName: { $first: "$clientName" } } },
				{ $sort: { count: -1 } },
				{ $limit: 5 },
				{ $project: { clientName: 1, cedula: "$_id", totalAccesses: "$count", _id: 0 } }
			]).exec(),
		]);

		const averageAccessesPerDay = monthAccesses / today.getDate();

		return {
			totalAccessesToday: todayAccesses,
			totalAccessesThisMonth: monthAccesses,
			averageAccessesPerDay: Math.round(averageAccessesPerDay * 100) / 100,
			totalAccesses,
			successfulAccesses,
			failedAccesses,
			mostActiveClients: topClients,
		};
	}

	async getAccessesByDateRange(startDate: Date, endDate: Date): Promise<GymAccess[]> {
		const gymAccesses = await this.gymAccessModel
			.find({
				accessDate: { $gte: startDate, $lte: endDate },
				successful: true,
			})
			.sort({ accessDate: -1 })
			.exec();

		return gymAccesses.map(this.mapToEntity);
	}

	private buildFilterQuery(filters?: GymAccessFilters): any {
		const query: any = {};

		if (filters?.cedula) {
			query.cedula = { $regex: filters.cedula, $options: "i" };
		}

		if (filters?.clientName) {
			query.clientName = { $regex: filters.clientName, $options: "i" };
		}

		if (filters?.successful !== undefined) {
			query.successful = filters.successful;
		}

		if (filters?.accessDay) {
			query.accessDay = filters.accessDay;
		}

		return query;
	}

	private buildStatsFilterQuery(filters?: GetGymAccessHistoryDto): any {
		const query: any = {};

		if (filters?.cedula) {
			query.cedula = { $regex: filters.cedula, $options: "i" };
		}

		if (filters?.clientName) {
			query.clientName = { $regex: filters.clientName, $options: "i" };
		}

		if (filters?.successful !== undefined) {
			query.successful = filters.successful;
		}

		return query;
	}

	private formatDateAsAccessDay(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	private mapToEntity(document: GymAccessDocument): GymAccess {
		return {
			id: (document._id as Types.ObjectId).toString(),
			clientId: document.clientId.toString(),
			cedula: document.cedula,
			accessDate: document.accessDate,
			accessDay: document.accessDay,
			successful: document.successful,
			reason: document.reason,
			clientName: document.clientName,
			clientPhoto: document.clientPhoto,
			createdAt: (document as any).createdAt,
			updatedAt: (document as any).updatedAt,
		};
	}
}
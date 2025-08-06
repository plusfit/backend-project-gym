import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { GymAccess, AccessStats } from "../entities/gym-access.entity";
import { GymAccessDocument } from "../schemas/gym-access.schema";
import { GymAccessRepository, GymAccessFilters } from "./gym-access.repository";

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
		const gymAccess = await this.gymAccessModel
			.findOne({ cedula, accessDay })
			.exec();
		
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

	async getStats(): Promise<AccessStats> {
		const today = new Date();
		const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

		const [todayAccesses, monthAccesses, previousMonthAccesses, topClients] = await Promise.all([
			this.gymAccessModel.countDocuments({
				accessDate: { $gte: startOfDay },
				successful: true,
			}).exec(),
			this.gymAccessModel.countDocuments({
				accessDate: { $gte: startOfMonth },
				successful: true,
			}).exec(),
			this.gymAccessModel.countDocuments({
				accessDate: { $gte: startOfPreviousMonth, $lt: startOfMonth },
				successful: true,
			}).exec(),
			this.gymAccessModel.aggregate([
				{ $match: { successful: true } },
				{ $group: { _id: "$cedula", count: { $sum: 1 }, clientName: { $first: "$clientName" } } },
				{ $sort: { count: -1 } },
				{ $limit: 5 },
				{ $project: { clientName: 1, cedula: "$_id", totalAccesses: "$count", _id: 0 } }
			]).exec(),
		]);

		const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
		const averageAccessesPerDay = monthAccesses / today.getDate();

		return {
			totalAccessesToday: todayAccesses,
			totalAccessesThisMonth: monthAccesses,
			averageAccessesPerDay: Math.round(averageAccessesPerDay * 100) / 100,
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
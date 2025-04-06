import { HttpException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateRoutineDto } from "@/src/context/routines/dto/create-routine.dto";
import { RoutineRepository } from "@/src/context/routines/repositories/routine.repository";
import { Routine } from "@/src/context/routines/schemas/routine.schema";

export const ROUTINE_REPOSITORY = "RoutineRepository";
export const SUB_ROUTINE_REPOSITORY = "RoutineRepository";

export class MongoRoutineRepository implements RoutineRepository {
	constructor(
		@InjectModel(Routine.name) private routineModel: Model<Routine>,
	) {}

	async findById(id: string): Promise<Routine | null> {
		return this.routineModel
			.findById(id)
			.populate({
				path: "subRoutines",
				populate: {
					path: "exercises",
				},
			})
			.exec();
	}

	async updateRoutine(id: string, updateData: any): Promise<Routine | null> {
		return this.routineModel
			.findByIdAndUpdate(id, updateData, { new: true })
			.populate({
				path: "subRoutines",
				populate: {
					path: "exercises",
				},
			})
			.exec();
	}

	async createRoutine(routine: CreateRoutineDto): Promise<Routine> {
		const newRoutine = new this.routineModel(routine);
		return newRoutine.save();
	}

	async deleteRoutine(id: string): Promise<any> {
		return await this.routineModel.findByIdAndDelete(id).exec();
	}

	async getRoutines(
		offset: number,
		limit: number,
		filters: any,
	): Promise<Routine[]> {
		return await this.routineModel
			.find(filters)
			.skip(offset)
			.limit(limit)
			.populate({
				path: "subRoutines",
				populate: {
					path: "exercises",
				},
			})
			.exec();
	}

	async countRoutines(filters: any): Promise<number> {
		return await this.routineModel.countDocuments(filters).exec();
	}

	getRoutinesBySubRoutine(subRoutineId: string): Promise<Routine[]> {
		return this.routineModel
			.find({ subRoutines: subRoutineId })
			.populate({
				path: "subRoutines",
				populate: {
					path: "exercises",
				},
			})
			.exec();
	}

	async removeSubRoutineFromRoutines(subRoutineId: string): Promise<any[]> {
		try {
			const routinesAffected = await this.routineModel
				.find({ subRoutines: subRoutineId })
				.exec();

			if (!routinesAffected || routinesAffected.length === 0) {
				return [];
			}

			await this.routineModel
				.updateMany(
					{ subRoutines: subRoutineId },
					{ $pull: { subRoutines: subRoutineId } },
				)
				.exec();

			return await this.routineModel
				.find({
					_id: { $in: routinesAffected.map((routine) => routine._id) },
				})
				.populate({
					path: "subRoutines",
					populate: {
						path: "exercises",
					},
				})
				.exec();
		} catch (error: any) {
			throw new HttpException(
				`Error al remover la subroutine de las rutinas: ${error.message}`,
				error.status || 500,
			);
		}
	}
}

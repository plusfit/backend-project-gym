import {
	HttpException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { EXERCISE_REPOSITORY } from "@/src/context/exercises/repositories/exercise.repository";
import { CreateSubRoutineDto } from "@/src/context/routines/dto/create-sub-routine.dto";
import { DeleteSubRoutineResponse } from "@/src/context/routines/interfaces/subroutine.interface";
import { ROUTINE_REPOSITORY } from "@/src/context/routines/repositories/mongo-routine.repository";
import { SUB_ROUTINE_REPOSITORY } from "@/src/context/routines/repositories/mongo-sub-routine.repository";

@Injectable()
export class SubRoutinesService {
	static removeExerciseFromSubRoutines: any;
	constructor(
		@Inject(SUB_ROUTINE_REPOSITORY)
		private readonly subRoutineRepository: any,
		@Inject(ROUTINE_REPOSITORY)
		private readonly routineRepository: any,
		@Inject(EXERCISE_REPOSITORY)
		private readonly exerciseRepository: any,
	) {}

	/**
	 * Crea una subroutine validando que cada ID de ejercicio exista.
	 */
	async createSubRoutine(
		createSubRoutineDto: CreateSubRoutineDto,
	): Promise<any> {
		try {
			// Validar que cada ID de ejercicio esté presente y exista
			for (const exerciseId of createSubRoutineDto.exercises) {
				if (!exerciseId) {
					throw new HttpException("Exercise ID is required", 400);
				}
				const exerciseExists =
					await this.exerciseRepository.findOne(exerciseId);
				if (!exerciseExists) {
					throw new NotFoundException(
						`Exercise with ID ${exerciseId} not found`,
					);
				}
			}
			const createdSubRoutine =
				await this.subRoutineRepository.createSubRoutine(createSubRoutineDto);
			return createdSubRoutine;
		} catch (error: any) {
			throw new HttpException(
				`Error creating subroutine: ${error.message}`,
				error.status || 500,
			);
		}
	}

	/**
	 * Elimina una subroutine y la remueve de todas las rutinas donde esté asignada,
	 * devolviendo además el listado de rutinas afectadas.
	 */
	async deleteSubRoutine(id: string): Promise<DeleteSubRoutineResponse> {
		try {
			const subroutine = await this.getSubRoutineById(id);
			if (!subroutine) {
				throw new NotFoundException(`Subroutine con ID ${id} no encontrada`);
			}

			const affectedRoutines =
				await this.routineRepository.removeSubRoutineFromRoutines(id);
			const deletedSubRoutine =
				await this.subRoutineRepository.deleteSubRoutine(id);

			return { affectedRoutines, deletedSubRoutine };
		} catch (error: any) {
			throw new HttpException(
				`Error deleting subroutine: ${error.message}`,
				error.status || 500,
			);
		}
	}

	/**
	 * Actualiza una subroutine.
	 * Si la subroutine no es custom y se provee un clientId, se crea una nueva.
	 */
	async updateSubRoutine(
		routineId: string,
		updateData: any,
		clientId?: string,
	): Promise<any> {
		try {
			const routine = await this.subRoutineRepository.findById(routineId);
			if (!routine) {
				throw new NotFoundException("Routine not found");
			}

			if (!routine.isCustom && clientId) {
				// Se marca la subroutine actual como custom y se crea una nueva
				routine.isCustom = true;
				const newRoutine = {
					...routine.toObject(),
					...updateData,
					isCustom: false,
				};

				return await this.subRoutineRepository.createRoutine(newRoutine);
			} else {
				return await this.subRoutineRepository.updateSubRoutine(
					routineId,
					updateData,
				);
			}
		} catch (error: any) {
			throw new HttpException(
				`Error updating subroutine: ${error.message}`,
				error.status || 500,
			);
		}
	}

	/**
	 * Recupera una subroutine por su ID.
	 */
	async getSubRoutineById(id: string): Promise<any> {
		try {
			const subroutine = await this.subRoutineRepository.findById(id);
			if (!subroutine) {
				throw new NotFoundException(`Subroutine con ID ${id} no encontrada`);
			}
			return subroutine;
		} catch (error: any) {
			throw new HttpException(
				`Error retrieving subroutine: ${error.message}`,
				error.status || 500,
			);
		}
	}

	/**
	 * Recupera un listado paginado de subroutines con filtros opcionales.
	 */
	async getSubRoutines(
		page: number,
		limit: number,
		name?: string,
		type?: string,
		mode?: string,
	): Promise<any> {
		try {
			const offset = (page - 1) * limit;
			const filters: any = {};

			if (name) {
				filters.name = { $regex: name, $options: "i" };
			}
			if (type) {
				filters.type = type;
			}
			if (mode) {
				filters.mode = mode;
			}

			const [data, total] = await Promise.all([
				this.subRoutineRepository.getSubRoutines(offset, limit, filters),
				this.subRoutineRepository.countSubRoutines(filters),
			]);

			return { data, total, page, limit };
		} catch (error: any) {
			throw new HttpException(
				`Error retrieving subroutines: ${error.message}`,
				error.status || 500,
			);
		}
	}

	/**
	 * Elimina un ejercicio y lo remueve de las subroutines donde esté asignado.
	 */
	async deleteExercise(id: string): Promise<string> {
		try {
			const wasRemoved = await this.exerciseRepository.remove(id);
			const exercisesRemovedFromSubRoutines =
				await this.subRoutineRepository.removeExerciseFromSubRoutines(id);

			if (wasRemoved && exercisesRemovedFromSubRoutines) {
				return "Exercise removed successfully";
			} else if (wasRemoved) {
				throw new HttpException(
					"Error when trying to remove exercise from subroutines",
					500,
				);
			} else {
				throw new NotFoundException("Exercise not found");
			}
		} catch (error: any) {
			throw new HttpException(
				`Error when trying to delete exercise: ${error.message}`,
				error.status || 500,
			);
		}
	}
}

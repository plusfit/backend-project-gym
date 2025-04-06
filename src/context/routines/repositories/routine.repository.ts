import { CreateRoutineDto } from "@/src/context/routines/dto/create-routine.dto";
import {
	Routine,
	RoutineDocument,
} from "@/src/context/routines/schemas/routine.schema";

export interface RoutineRepository {
	findById(id: string): Promise<Routine | null>;
	updateRoutine(id: string, updateData: any): Promise<Routine | null>;
	createRoutine(routine: CreateRoutineDto): Promise<Routine>;
	deleteRoutine(id: string): Promise<RoutineDocument>;
	countRoutines(filters: any): Promise<number>;
	getRoutines(offset: number, limit: number, filters: any): Promise<Routine[]>;
	removeSubRoutineFromRoutines(subRoutineId: string): Promise<any[]>;
}

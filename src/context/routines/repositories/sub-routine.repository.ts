import { CreateSubRoutineDto } from "@/src/context/routines/dto/create-sub-routine.dto";
import { SubRoutine } from "@/src/context/routines/schemas/sub-routine.schema";

export interface SubRoutineRepository {
  findById(id: string): Promise<SubRoutine | null>;
  updateSubRoutine(id: string, updateData: any): Promise<SubRoutine | null>;
  createSubRoutine(routine: CreateSubRoutineDto): Promise<SubRoutine>;
  deleteSubRoutine(id: string): Promise<any>;
  countSubRoutines(filters: any): Promise<number>;
  getSubRoutines(
    offset: number,
    limit: number,
    filters: any,
  ): Promise<SubRoutine[]>;
  removeExerciseFromSubRoutines(exercisesId: string): Promise<any>;
}

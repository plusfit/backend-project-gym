import { SubRoutine } from "@/src/context/routines/entities/subroutine.entity";
import { Routine } from "@/src/context/routines/schemas/routine.schema";

export interface DeleteSubRoutineResponse {
	affectedRoutines: Routine[];
	deletedSubRoutine: SubRoutine | null;
}

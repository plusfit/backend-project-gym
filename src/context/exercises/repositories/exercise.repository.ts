import { CreateExerciseDto } from "@/src/context/exercises/dto/create-exercise.dto";
import { Exercise } from "@/src/context/exercises/entities/exercise.entity";

export const EXERCISE_REPOSITORY = "ExerciseRepository";
export interface ExerciseRepository {
	createExercise(product: CreateExerciseDto): Promise<Exercise>;

	getExercises(
		offset: number,
		limit: number,
		filters: { name?: string; productType?: string },
	): Promise<Exercise[]>;

	countExercises(filters: {
		name?: string;
		productType?: string;
	}): Promise<number>;

	findOne(id: string): Promise<Exercise | undefined>;
	remove(id: string): Promise<boolean>;
}

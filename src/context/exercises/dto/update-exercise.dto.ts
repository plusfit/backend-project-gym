import { PartialType } from "@nestjs/mapped-types"; //TODO: Check this compare to swagger
import { IsDate, IsOptional } from "class-validator";

import { CreateExerciseDto } from "./create-exercise.dto";

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {
	@IsDate()
	@IsOptional()
	updatedAt?: Date;
}

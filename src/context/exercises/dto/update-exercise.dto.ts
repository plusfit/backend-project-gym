import { PartialType } from "@nestjs/mapped-types"; //TODO: Check this compare to swagger

import { CreateExerciseDto } from "./create-exercise.dto";

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}

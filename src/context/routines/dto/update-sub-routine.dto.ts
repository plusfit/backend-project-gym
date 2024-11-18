import { PartialType } from "@nestjs/swagger";

import { CreateSubRoutineDto } from "@/src/context/routines/dto/create-sub-routine.dto";

export class UpdateSubRoutineDto extends PartialType(CreateSubRoutineDto) {}

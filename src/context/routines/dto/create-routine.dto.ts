import { IsArray, IsBoolean, IsString } from "class-validator";

export class CreateRoutineDto {
  @IsString()
  name!: string;

  @IsBoolean()
  isCustom!: boolean;

  @IsArray()
  exercises!: string[];
}

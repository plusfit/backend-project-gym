import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  gifUrl?: string;

  @IsString()
  @IsNotEmpty()
  type!: string; //cardio o room

  @IsString()
  @IsNotEmpty()
  mode!: string; //reps o time. Si es time: minutes - rest.       Si es reps: reps - series

  // Campos para 'cardio'
  @ValidateIf(obj => obj.type === "cardio")
  @IsNumber()
  @IsOptional()
  minutes?: number;

  @ValidateIf(obj => obj.type === "cardio")
  @IsNumber()
  @IsOptional()
  rest?: number;

  // Campos para 'room'
  @ValidateIf(obj => obj.type === "room")
  @IsNumber()
  @IsOptional()
  reps?: number;

  @ValidateIf(obj => obj.type === "room")
  @IsNumber()
  @IsOptional()
  series?: number;
}

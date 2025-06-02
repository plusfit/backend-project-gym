import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

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

  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  type!: string; //cardio o room

  @IsNumber()
  rest?: number; //descanso en segundos

  // Campos para 'cardio'
  @ValidateIf((obj) => obj.type === "cardio")
  @IsNumber()
  @IsOptional()
  minutes?: number;

  // Campos para 'room'
  @ValidateIf((obj) => obj.type === "room")
  @IsNumber()
  @IsOptional()
  reps?: number;

  @ValidateIf((obj) => obj.type === "room")
  @IsNumber()
  @IsOptional()
  series?: number;
}

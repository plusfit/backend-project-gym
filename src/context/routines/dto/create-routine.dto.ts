import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { Types } from "mongoose";
import { Expose } from "class-transformer";

export class CreateRoutineDto {
  @Expose()
  @IsOptional()
  _id?: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "The name of the routine",
    example: "Morning routine",
  })
  name!: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "The category of the routine",
    example: "Cardio",
  })
  category!: string;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Si la rutina es personalizada",
    example: false,
  })
  isCustom!: boolean;

  @Expose()
  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({
    description: "The subroutines that the routine has",
    type: [String], // Cambia a tipo String ya que es un array de IDs
    example: ["60f8b3f3d7f9a8e1c4e2d5e0"],
  })
  subRoutines!: Types.ObjectId[];
}

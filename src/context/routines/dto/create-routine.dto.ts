import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsMongoId, IsString } from "class-validator";
import { Types } from "mongoose";

export class CreateRoutineDto {
  @IsString()
  @ApiProperty({
    description: "The name of the routine",
    example: "Morning routine",
  })
  name!: string;

  @IsString()
  @ApiProperty({
    description: "The category of the routine",
    example: "Cardio",
  })
  category!: string;

  @IsBoolean()
  @ApiProperty({
    description: "Si la rutina es personalizada",
    example: false,
  })
  isCustom!: boolean;

  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({
    description: "The subroutines that the routine has",
    type: [String], // Cambia a tipo String ya que es un array de IDs
    example: ["60f8b3f3d7f9a8e1c4e2d5e0"],
  })
  subRoutines!: Types.ObjectId[];
}

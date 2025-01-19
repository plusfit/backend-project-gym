import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";

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
    description: "The description of the routine",
    example: "This is a morning routine",
  })
  description!: string;

  // @Expose()
  // @IsString()
  // @ApiProperty({
  //   description: "The category of the routine",
  //   example: "Cardio",
  // })
  // category!: string;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Si la rutina es personalizada",
    example: false,
  })
  isCustom!: boolean;

  @ApiProperty({
    description: "Indica las subrutinas de la rutina",
    type: [String],
    example: ["66d75350be595041c1c2fe4d"],
  })
  @IsArray()
  @IsMongoId({ each: true })
  subRoutines!: string[];
}

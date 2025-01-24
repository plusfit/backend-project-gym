import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsMongoId, IsNotEmpty, IsString } from "class-validator";

export class CreateSubRoutineDto {
  @ApiProperty({
    description: "Nombre de la Subrutina",
    example: "SubRutina Default",
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Indica si la rutina es personalizada",
    example: false,
  })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({
    description: "Indica los ejercicios de la rutina",
    type: [String],
    example: ["66d75350be595041c1c2fe4d"],
  })
  @IsArray()
  @IsMongoId({ each: true })
  exercises!: string[];

  @IsString()
  @ApiProperty({
    description: "The category of the routine",
    example: "Cardio",
  })
  category!: string;
}

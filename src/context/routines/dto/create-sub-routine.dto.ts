import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsString,
} from "class-validator";

import { EDay } from "@/src/context/shared/enums/days.enum";

export class CreateSubRoutineDto {
  @ApiProperty({
    description: "Nombre de la Subrutina",
    example: "SubRutina Default",
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Indica si la rutina es personalizada",
    example: false,
  })
  @IsBoolean()
  isCustom!: boolean;

  @ApiProperty({
    description: "Indica los ejercicios de la rutina",
    type: [String], // Cambiar aquí explícitamente para evitar Swagger circular.
    example: ["66d75350be595041c1c2fe4d"],
  })
  @IsArray()
  @IsMongoId({ each: true })
  exercises!: string[];

  @IsEnum(EDay)
  day!: EDay;
}

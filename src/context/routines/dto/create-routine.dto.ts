import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsMongoId, IsString } from "class-validator";

export class CreateRoutineDto {
  @ApiProperty({ description: 'Nombre de la rutina', example: 'Rutina Default' })
  @IsString()
  name!: string;
  @ApiProperty({ description: 'Indica si la rutina es personalizada', example: false })
  @IsBoolean()
  isCustom!: boolean;

  @ApiProperty({ description: 'Indica los ejercicios de la rutina', example: ['66d75350be595041c1c2fe4d'] })
  @IsArray()
  @IsMongoId({ each: true })
  exercises!: string[];
}

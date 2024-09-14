import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetPlansDto {
  @ApiProperty({ description: "Número de página", example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: "Cantidad de rutinas por página", example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 5;

  @ApiProperty({ description: "Name filter", example: "Routine 1" })
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  plansType?: string;
}

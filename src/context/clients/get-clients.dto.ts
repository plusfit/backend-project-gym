import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetClientsDto {
  @ApiProperty({ description: "Número de página", example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: "Cantidad de clientes por página", example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 5;

  @ApiProperty({ description: "Filtro por Nombre", example: "Nahuel" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: "Filtro por email", example: "ng@gmail.com" })
  @IsOptional()
  @IsString()
  email?: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class PageDto {
	@ApiProperty({ description: "Número de página", example: 1 })
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page = 1;

	@ApiProperty({ description: "Cantidad de rutinas por página", example: 5 })
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	limit = 5;
}

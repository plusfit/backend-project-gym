import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetClientsAssignalDto {
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

	@ApiPropertyOptional({ description: "Name filter", example: "Routine 1" })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiPropertyOptional({
		description: "Email filter",
		example: "juan@gmail.com",
	})
	@IsOptional()
	@IsString()
	email?: string;

	@ApiPropertyOptional({
		description: "CI filter",
		example: "12345678",
	})
	@IsOptional()
	@IsString()
	CI?: string;

	@IsOptional()
	@IsString()
	hourId?: string;
}

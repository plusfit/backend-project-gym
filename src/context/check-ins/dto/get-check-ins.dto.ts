import { IsOptional, IsString, IsDateString, IsMongoId, IsNumber, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { Types } from "mongoose";

export class GetCheckInsDto {
	@ApiPropertyOptional({
		description: "Número de página",
		example: 1,
		default: 1,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({
		description: "Cantidad de elementos por página",
		example: 10,
		default: 10,
	})
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	limit?: number = 10;

	@ApiPropertyOptional({
		description: "ID del cliente para filtrar",
		example: "507f1f77bcf86cd799439011",
	})
	@IsOptional()
	@IsMongoId()
	clientId?: Types.ObjectId;

	@ApiPropertyOptional({
		description: "Fecha de inicio para filtrar (formato ISO)",
		example: "2024-01-01T00:00:00.000Z",
	})
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@ApiPropertyOptional({
		description: "Fecha de fin para filtrar (formato ISO)",
		example: "2024-12-31T23:59:59.999Z",
	})
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiPropertyOptional({
		description: "ID de la organización para filtrar",
		example: "org_123",
	})
	@IsOptional()
	@IsString()
	organizationId?: string;
}
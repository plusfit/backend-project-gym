import { IsOptional, IsString, IsDateString, IsNumber, Min, Matches, Length } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";

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
		description: "Cédula de identidad del cliente para filtrar (8 a 9 dígitos)",
		example: "12345678",
	})
	@IsOptional()
	@IsString()
	@Length(8, 9, { message: "La cédula debe tener entre 8 y 9 dígitos" })
	@Matches(/^[0-9]{8,9}$/, { message: "La cédula debe contener solo números" })
	ci?: string;

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


}
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min, IsEnum } from "class-validator";
import { EClientRole } from "@/src/context/shared/enums/clients-role.enum";

export class GetClientsDto {
	@ApiProperty({ description: "Número de página", example: 1 })
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page = 1;

	@ApiProperty({ description: "Cantidad de clientes por página", example: 5 })
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	limit = 5;

	@ApiPropertyOptional({ description: "Filtro por Nombre", example: "Nahuel" })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiPropertyOptional({
		description: "Filtro por email",
		example: "ng@gmail.com",
	})
	@IsOptional()
	@IsString()
	email?: string;

	@IsOptional()
	@IsString()
	CI?: string;

	@IsOptional()
	@IsEnum(EClientRole)
	role?: EClientRole;

	@IsOptional()
	@IsString()
	withoutPlan?: boolean;

	@IsOptional()
	@IsString()
	disabled?: boolean;
}

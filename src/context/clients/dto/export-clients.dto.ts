import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum } from "class-validator";
import { EClientRole } from "@/src/context/shared/enums/clients-role.enum";

export class ExportClientsDto {
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

	@ApiPropertyOptional({
		description: "Filtro por clientes atrasados (availableDays = 0)",
		example: true,
	})
	@IsOptional()
	@IsString()
	overdue?: boolean;

  @IsString()
  message: string;
}

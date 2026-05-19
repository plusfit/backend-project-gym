import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsBooleanString } from "class-validator";
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
	@IsBooleanString()
	withoutPlan?: boolean;

	@IsOptional()
	@IsBooleanString()
	disabled?: boolean;

	@ApiPropertyOptional({
		description: "Filtro por clientes atrasados (availableDays = 0)",
		example: true,
	})
	@IsOptional()
	@IsBooleanString()
	overdue?: boolean;

  @ApiProperty({ description: "Mensaje para incluir en el CSV de WhatsApp", example: "Hola! Te recordamos que..." })
  @IsString()
  message!: string;
}

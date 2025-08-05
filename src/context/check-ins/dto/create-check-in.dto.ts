import { IsNotEmpty, IsOptional, IsString, Matches, Length } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCheckInDto {
	@ApiProperty({
		description: "Cédula de identidad del cliente (8 a 9 dígitos)",
		example: "12345678",
	})
	@IsString()
	@Length(8, 9, { message: "La cédula debe tener entre 8 y 9 dígitos" })
	@Matches(/^[0-9]{8,9}$/, { message: "La cédula debe contener solo números" })
	ci!: string;

	@ApiPropertyOptional({
		description: "Notas adicionales sobre el ingreso",
		example: "Ingreso regular",
	})
	@IsOptional()
	@IsString()
	notes?: string;
}
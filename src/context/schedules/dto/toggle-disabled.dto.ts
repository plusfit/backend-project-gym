import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ToggleDisabledDto {
	@ApiProperty({
		description: "Estado de habilitación (true para deshabilitar, false para habilitar)",
		example: false,
	})
	@IsBoolean()
	disabled!: boolean;

	@ApiProperty({
		description: "Razón por la cual se deshabilita el día/horario (opcional, solo se usa cuando disabled=true)",
		example: "Mantenimiento del gimnasio",
		required: false,
	})
	@IsOptional()
	@IsString()
	disabledReason?: string;
}

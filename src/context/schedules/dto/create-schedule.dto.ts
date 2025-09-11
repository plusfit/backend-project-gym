import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsMongoId, IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateScheduleDto {
	@ApiProperty({
		description: "Hora de inicio del horario",
		example: "12",
	})
	@IsString()
	startTime!: string;

	@ApiProperty({
		description: "Hora de finalización del horario",
		example: "13",
	})
	@IsString()
	endTime!: string;

	@ApiProperty({
		description: "Cantidad máxima de clientes permitidos",
		example: 10,
	})
	@IsInt()
	maxCount!: number;

	@ApiProperty({
		description: "Lista de IDs de clientes",
		example: ["60c72b2f5f1b2c6d88f0e0c6"],
	})
	@IsArray()
	@IsMongoId({ each: true })
	clients!: string[];

	@ApiProperty({
		description: "Día de la semana para el horario",
		example: "Monday",
	})
	@IsString()
	day!: string;

	@ApiProperty({
		description: "Estado de habilitación del horario",
		example: false,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	disabled?: boolean;

	@ApiProperty({
		description: "Razón por la cual se deshabilita el horario (opcional)",
		example: "Mantenimiento del gimnasio",
		required: false,
	})
	@IsOptional()
	@IsString()
	disabledReason?: string;
}

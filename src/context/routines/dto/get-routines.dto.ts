import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetRoutinesDto {
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

	@ApiProperty({ description: "Name filter", example: "Routine 1" })
	@IsString()
	@IsOptional()
	name?: string;

	@ApiProperty({ description: "Type filter", example: "Sala" })
	@IsString()
	@IsOptional()
	type?: string;

	@ApiProperty({ description: "Es general" })
	@Transform(({ value }) => {
		if (value === 'true') return true;
		if (value === 'false') return false;
		return value;
	})
	@IsBoolean()
	@IsOptional()
	isGeneral?: boolean;

	@ApiProperty({ description: "Mostrar en pantalla", example: true })
	@Transform(({ value }) => {
		if (value === 'true') return true;
		if (value === 'false') return false;
		return value;
	})
	@IsBoolean()
	@IsOptional()
	showOnScreen?: boolean;

	@ApiProperty({ description: "Mode filter", example: "Cardio" })
	@IsString()
	@IsOptional()
	mode?: string;
}

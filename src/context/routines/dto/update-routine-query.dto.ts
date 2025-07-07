import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateRoutineQueryDto {
	@IsOptional()
	@IsString()
	@ApiProperty({
		description: "ID del cliente para actualizar rutina",
		required: false,
	})
	clientId?: string;
}

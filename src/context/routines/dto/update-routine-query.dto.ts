import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateRoutineQueryDto {
	@IsOptional()
	@IsString()
	@ApiProperty({
		description: "ID del cliente para actualizar rutina",
		required: false,
	})
	clientId?: string;
}

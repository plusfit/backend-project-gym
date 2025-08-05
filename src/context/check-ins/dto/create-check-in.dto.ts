import { IsNotEmpty, IsOptional, IsString, IsMongoId } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Types } from "mongoose";

export class CreateCheckInDto {
	@ApiProperty({
		description: "ID del cliente que está ingresando",
		example: "507f1f77bcf86cd799439011",
	})
	@IsNotEmpty()
	@IsMongoId()
	clientId!: Types.ObjectId;

	@ApiPropertyOptional({
		description: "ID de la organización",
		example: "org_123",
	})
	@IsOptional()
	@IsString()
	organizationId?: string;

	@ApiPropertyOptional({
		description: "Notas adicionales sobre el ingreso",
		example: "Ingreso regular",
	})
	@IsOptional()
	@IsString()
	notes?: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ValidatePasswordDto {
	@ApiProperty({ 
		example: "userPassword123", 
		description: "Password to validate" 
	})
	@IsString()
	@IsNotEmpty()
	password!: string;
}
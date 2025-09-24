import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterAuthDto {
	@ApiProperty({ example: "user@example.com" })
	@IsString()
	@IsNotEmpty()
	email!: string;

	@ApiProperty({ 
		example: "03AGdBq25...", 
		description: "reCAPTCHA v3 token" 
	})
	@IsString()
	@IsNotEmpty()
	recaptchaToken!: string;

	@ApiProperty({ 
		example: "mySecurePassword123", 
		description: "User password (optional)" 
	})
	@IsOptional()
	@IsString()
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	password?: string;
}

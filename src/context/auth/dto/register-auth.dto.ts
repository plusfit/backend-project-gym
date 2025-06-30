import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

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
}

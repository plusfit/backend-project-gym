import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginAuthDto {
	@ApiProperty({ example: "example-token" })
	@IsString()
	@IsNotEmpty()
	token!: string;

	@ApiProperty({ 
		example: "03AGdBq25...", 
		description: "reCAPTCHA v3 token" 
	})
	@IsString()
	@IsNotEmpty()
	recaptchaToken!: string;
}

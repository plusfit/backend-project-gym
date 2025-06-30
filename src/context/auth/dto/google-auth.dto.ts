import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GoogleAuthDto {
  @ApiProperty({ example: "google-id-token" })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: "https://example.com/avatar.jpg", required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ 
    example: "03AGdBq25...", 
    description: "reCAPTCHA v3 token",
    required: false 
  })
  @IsString()
  @IsOptional()
  recaptchaToken?: string;
}

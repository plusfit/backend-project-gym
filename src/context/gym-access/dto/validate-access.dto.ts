import { IsNotEmpty, IsString, Matches } from "class-validator";

export class ValidateAccessDto {
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d{8}$/, { message: "Cedula must be exactly 8 digits" })
	cedula!: string;
}
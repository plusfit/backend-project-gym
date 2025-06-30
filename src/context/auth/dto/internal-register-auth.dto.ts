import { IsNotEmpty, IsString } from "class-validator";

export class InternalRegisterAuthDto {
	@IsString()
	@IsNotEmpty()
	email!: string;
}

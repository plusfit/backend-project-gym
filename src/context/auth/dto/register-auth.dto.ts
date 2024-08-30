import { IsNotEmpty, IsString } from "class-validator";

export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  email!: string;
}

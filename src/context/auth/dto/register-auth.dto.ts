import { IsNotEmpty, IsString } from "class-validator";

export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  email!: string;
}

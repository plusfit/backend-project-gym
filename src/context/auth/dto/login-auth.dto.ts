import { IsNotEmpty, IsString } from "class-validator";

export class LoginAuthDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

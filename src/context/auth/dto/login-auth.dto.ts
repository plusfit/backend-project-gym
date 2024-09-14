import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginAuthDto {
  @ApiProperty({ example: "example-token" })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

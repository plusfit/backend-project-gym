import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from "class-validator";

import { EClientRole } from "@/src/context/shared/enums/clients-role.enum";

export class CreateClientDto {
  @IsEnum(EClientRole)
  @IsNotEmpty()
  role!: EClientRole;

  @IsMongoId()
  @IsNotEmpty()
  planId?: string;

  @IsMongoId()
  @IsNotEmpty()
  routineId?: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  userInfo?: []; //TODO: Create userInfoDTO

  @IsNotEmpty()
  @IsString()
  refreshToken?: string;
}

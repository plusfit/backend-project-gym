import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsObject,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";
import { Permission } from "@/src/context/shared/enums/permissions.enum";

interface OrganizationLimits {
  maxClients: number;
  maxAdmins: number;
  features: string[];
}

export class AdminUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateOrganizationDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  subscriptionExpiresAt?: Date;

  @IsOptional()
  @IsObject()
  limits?: OrganizationLimits;

  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];

  @ValidateNested()
  @Type(() => AdminUserDto)
  adminUser!: AdminUserDto;
}

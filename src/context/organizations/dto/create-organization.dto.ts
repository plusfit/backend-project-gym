import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsObject,
  IsNumber,
  IsArray,
} from "class-validator";

interface OrganizationLimits {
  maxClients: number;
  maxAdmins: number;
  features: string[];
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
}

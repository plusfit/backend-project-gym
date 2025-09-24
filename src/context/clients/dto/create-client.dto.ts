import {
	IsEmail,
	IsEnum,
	IsMongoId,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength,
} from "class-validator";

import { EClientRole } from "@/src/context/shared/enums/clients-role.enum";

export class CreateClientDto {
	@IsEnum(EClientRole)
	role!: EClientRole;

	@IsMongoId()
	planId?: string;

	@IsMongoId()
	routineId?: string;

	@IsEmail()
	email!: string;

	@IsNotEmpty()
	userInfo?: []; //TODO: Create userInfoDTO

	@IsString()
	refreshToken?: string;

	@IsOptional()
	@IsString()
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	password?: string;

	@IsOptional()
	@IsString()
	@MinLength(6, { message: 'Plain password must be at least 6 characters long' })
	plainPassword?: string;
}

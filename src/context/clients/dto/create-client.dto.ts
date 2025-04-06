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
}

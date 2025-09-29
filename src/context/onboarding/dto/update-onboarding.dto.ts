import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsBoolean,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";

import {
	HealthInfoDto,
	PersonalInfoDto,
	StepDataDto,
	TrainingPreferencesDto,
} from "./create-onboarding.dto";

export class UpdateOnboardingDto {
	@ApiProperty({
		description: "User ID associated with the onboarding process",
		example: "user123",
		required: false,
	})
	@IsString()
	@IsOptional()
	userId?: string;

	@ApiProperty({
		description: "Current step in the onboarding process",
		example: 1,
		required: false,
	})
	@IsNumber()
	@IsOptional()
	step?: number;

	@ApiProperty({
		description: "Whether the onboarding process is completed",
		example: false,
		required: false,
	})
	@IsBoolean()
	@IsOptional()
	completed?: boolean;

	@ApiProperty({
		description: "Step-specific data for the onboarding process",
		type: StepDataDto,
		required: false,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => StepDataDto)
	data?: StepDataDto;
}

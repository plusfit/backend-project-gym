import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsArray,
	IsBoolean,
	IsDateString,
	IsEnum,
	IsISO8601,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	Matches,
	Max,
	Min,
	ValidateNested,
} from "class-validator";

// Step 1: Personal Information
export class PersonalInfoDto {
	@ApiProperty({ example: "John Doe", description: "Full name of the user" })
	@IsString()
	@IsNotEmpty()
	fullName!: string;

	@ApiProperty({ example: "123 Main St", description: "Address of the user" })
	@IsString()
	@IsNotEmpty()
	address!: string;

	@ApiProperty({
		example: "09XXXXXXX",
		description: "Phone number of the user",
	})
	@IsString()
	@IsNotEmpty()
	@Matches(/^09\d{7}$/, { message: "Phone must be in format 09XXXXXXX" })
	phone!: string;

	@ApiProperty({ example: "Mutual Name", description: "Mutual name" })
	@IsString()
	@IsNotEmpty()
	mutual!: string;

	@ApiProperty({ example: "1990-01-01", description: "Date of birth" })
	@IsDateString()
	@IsNotEmpty()
	dateOfBirth!: string;

	@ApiProperty({
		example: "male",
		description: "User's sex",
		enum: ["male", "female", "other"],
	})
	@IsString()
	@IsNotEmpty()
	sex!: string;

	@ApiProperty({ example: "12345678", description: "Identification number" })
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d{8}$/, { message: "CI must be exactly 8 digits" })
	ci!: string;
}

// Step 2: Health Information
export class HealthHistoryDto {
	@ApiProperty({ example: "None", description: "Respiratory conditions" })
	@IsString()
	@IsNotEmpty()
	respiratory!: string;

	@ApiProperty({ example: "None", description: "Cardiac conditions" })
	@IsString()
	@IsNotEmpty()
	cardiac!: string;

	@ApiProperty({ example: "None", description: "Surgical history" })
	@IsString()
	@IsNotEmpty()
	chirurgical!: string;

	@ApiProperty({ example: "None", description: "Previous injuries" })
	@IsString()
	@IsNotEmpty()
	injuries!: string;
}

export class HealthInfoDto {
	@ApiProperty({ example: "120/80", description: "Blood pressure" })
	@IsString()
	@IsNotEmpty()
	bloodPressure!: string;

	@ApiProperty({ description: "Health history details" })
	@ValidateNested()
	@Type(() => HealthHistoryDto)
	history!: HealthHistoryDto;
}

// Step 3: Training Preferences
export class TrainingPreferencesDto {
	@ApiProperty({
		example: 3,
		description: "Number of training days per week",
		minimum: 1,
		maximum: 7,
	})
	@IsNumber()
	@IsNotEmpty()
	@Min(1)
	@Max(7)
	trainingDays!: number;

	@ApiProperty({ example: "Weight Loss", description: "Training goal" })
	@IsString()
	@IsNotEmpty()
	goal!: string;

	@ApiProperty({ example: "Weightlifting", description: "Type of training" })
	@IsString()
	@IsNotEmpty()
	trainingType!: string;

	@ApiProperty({
		example: "Beginner",
		description: "Training experience level",
	})
	@IsString()
	@IsNotEmpty()
	trainingLevel!: string;
}

export class StepDataDto {
	@ApiProperty({
		description: "Personal information data for step 1",
		required: false,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => PersonalInfoDto)
	step1?: PersonalInfoDto;

	@ApiProperty({
		description: "Health information data for step 2",
		required: false,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => HealthInfoDto)
	step2?: HealthInfoDto;

	@ApiProperty({
		description: "Training preferences data for step 3",
		required: false,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => TrainingPreferencesDto)
	step3?: TrainingPreferencesDto;
}

export class CreateOnboardingDto {
	@ApiProperty({
		description: "User ID associated with the onboarding process",
		example: "user123",
	})
	@IsString()
	@IsNotEmpty()
	userId!: string;

	@ApiProperty({
		description: "Current step in the onboarding process",
		example: 1,
	})
	@IsNumber()
	@IsNotEmpty()
	step!: number;

	@ApiProperty({
		description: "Whether the onboarding process is completed",
		example: false,
		default: false,
	})
	@IsBoolean()
	@IsOptional()
	completed?: boolean;

	@ApiProperty({
		description: "Step-specific data for the onboarding process",
		type: StepDataDto,
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => StepDataDto)
	data?: StepDataDto;
}

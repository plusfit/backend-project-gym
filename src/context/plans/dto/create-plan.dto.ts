import { ApiProperty } from "@nestjs/swagger";
import {
	ArrayUnique,
	IsArray,
	IsBoolean,
	IsEnum,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from "class-validator";

import {
	ExperienceLevel,
	PlanCategory,
	PlanGoal,
	PlanType,
	Tags,
} from "@/src/context/shared/enums/plan.enum";

export class CreatePlanDto {
	@ApiProperty({
		description: "The name of the plan",
		example: "Plan 1",
	})
	@IsString()
	@IsNotEmpty()
	name!: string;

	@ApiProperty({
		description: "The type of the plan",
		example: PlanType.MIXED,
		enum: PlanType,
	})
	@IsEnum(PlanType)
	@IsNotEmpty()
	type!: PlanType;

	@ApiProperty({
		description: "The category of the plan",
		example: PlanCategory.WEIGHT_LOSS,
		enum: PlanCategory,
	})
	@IsEnum(PlanCategory)
	@IsNotEmpty()
	category!: PlanCategory;

	@ApiProperty({
		description: "The goal of the plan",
		example: PlanGoal.LOSE_WEIGHT,
		enum: PlanGoal,
	})
	@IsEnum(PlanGoal)
	@IsNotEmpty()
	goal!: PlanGoal;

	@ApiProperty({
		description: "The experience level required for the plan",
		example: ExperienceLevel.BEGINNER,
		enum: ExperienceLevel,
	})
	@IsEnum(ExperienceLevel)
	@IsNotEmpty()
	experienceLevel!: ExperienceLevel;

	@ApiProperty({
		description: "The minimum age required for the plan",
		example: 18,
	})
	@IsNumber()
	@Min(0)
	@IsOptional()
	minAge?: number;

	@ApiProperty({
		description: "The maximum age allowed for the plan",
		example: 60,
	})
	@IsNumber()
	@Max(100)
	@IsOptional()
	maxAge?: number;

	@ApiProperty({
		description: "Indicates whether the plan includes a coach",
		example: true,
	})
	@IsBoolean()
	@IsOptional()
	includesCoach!: boolean;

	@ApiProperty({
		description: "Tags for filtering and categorization",
		example: [Tags.CARDIO, Tags.GYM_WORKOUT],
		enum: Tags,
		isArray: true,
	})
	@IsArray()
	@ArrayUnique()
	@IsEnum(Tags, { each: true })
	@IsOptional()
	tags!: Tags[];

	@ApiProperty({
		description: "The default routine of the plan",
		example: "60f8b3f3d7f9a8e1c4e2d5e0",
	})
	@IsMongoId()
	@IsNotEmpty()
	defaultRoutine!: string;

	@ApiProperty({
		description: "The number of days of the plan",
		example: 3,
	})
	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(7)
	days!: number;
}

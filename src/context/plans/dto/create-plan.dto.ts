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
  ValidateIf,
} from "class-validator";

import {
  InjuryType,
  PlanGoal,
  PlanType,
  SexType,
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
    description: "The goal of the plan",
    example: PlanGoal.LOSE_WEIGHT,
    enum: PlanGoal,
  })
  @IsEnum(PlanGoal)
  @IsNotEmpty()
  goal!: PlanGoal;

  @ApiProperty({
    description: "The injury type (required when goal is INJURY_RECOVERY)",
    example: InjuryType.KNEE,
    enum: InjuryType,
    required: false,
  })
  @IsEnum(InjuryType)
  @ValidateIf((o) => o.goal === PlanGoal.INJURY_RECOVERY)
  @IsNotEmpty({
    message: 'Injury type is required when goal is "injuryRecovery"',
  })
  injuryType?: InjuryType;

  @ApiProperty({
    description: "The sex type for the plan",
    example: SexType.UNISEX,
    enum: SexType,
  })
  @IsEnum(SexType)
  @IsNotEmpty()
  sexType!: SexType;

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

  @ApiProperty({
    description: "The price of the plan",
    example: 1000,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price!: number;
}

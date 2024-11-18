import { ApiProperty } from "@nestjs/swagger";
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from "class-validator";

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
    example: "Basic",
  })
  @IsString()
  @IsNotEmpty()
  type!: string;

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
  @Max(6)
  days!: number;
}

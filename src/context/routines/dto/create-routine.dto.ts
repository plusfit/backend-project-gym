import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { Types } from "mongoose";

import { EDay } from "@/src/context/shared/enums/days.enum";

export class CreateRoutineDto {
  @Expose()
  @IsOptional()
  _id?: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "The name of the routine",
    example: "Morning routine",
  })
  name!: string;

  @Expose()
  @IsString()
  @ApiProperty({
    description: "The category of the routine",
    example: "Cardio",
  })
  category!: string;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    description: "Si la rutina es personalizada",
    example: false,
  })
  isCustom!: boolean;

  @Expose()
  @IsArray()
  @ApiProperty({
    description: "The subRoutines that the routine has",
    example: [
      {
        day: "Lunes",
        subRoutine: "60f8b3f3d7f9a8e1c4e2d5e0",
      },
    ],
  })
  subRoutines!: SubRoutineDetail[];
}

class SubRoutineDetail {
  @Expose()
  @IsString()
  @ApiProperty({
    description: "The day of the week",
    example: "Monday",
  })
  @IsEnum(EDay)
  day!: EDay;

  @Expose()
  @IsMongoId()
  @ApiProperty({
    description: "The subRoutine that the routine has",
    example: "60f8b3f3d7f9a8e1c4e2d5e0",
  })
  subRoutine!: Types.ObjectId;
}

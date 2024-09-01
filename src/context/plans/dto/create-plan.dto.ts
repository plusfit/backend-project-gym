import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";

export class Routine {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsBoolean()
  isCustom: boolean = false;

  @ApiProperty()
  @IsArray()
  exercises!: string[];

  @ApiProperty()
  @IsString()
  day!: string;
}

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ type: [Routine] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Routine)
  @IsNotEmpty()
  routines!: Routine[];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  daysCount!: number;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  days!: string[];
}

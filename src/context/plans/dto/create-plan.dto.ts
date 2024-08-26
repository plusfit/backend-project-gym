import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name!: string;
  @ApiProperty()
  @IsString()
  type!: string;
  @ApiProperty()
  @IsString()
  routine!: string;
  @ApiProperty()
  @IsNumber()
  daysCount!: number;
  @ApiProperty()
  @IsString({ each: true })
  days!: string[];
}

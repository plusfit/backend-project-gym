import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class GetCategoriesDto {
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @IsNumber()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsString()
  name?: string;
}

import { IsOptional, IsString } from "class-validator";

export class FiltersDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  plansType?: string;
}

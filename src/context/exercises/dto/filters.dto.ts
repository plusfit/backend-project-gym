import { IsOptional, IsString } from "class-validator";

export class FiltersDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  mode?: string;
}

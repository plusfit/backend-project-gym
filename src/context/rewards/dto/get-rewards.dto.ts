import { IsOptional, IsNumber, Min, Max, IsString, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";

export class GetRewardsDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 10;

	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@Transform(({ value }) => value === "true")
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	minRequiredDays?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	maxRequiredDays?: number;
}
import { IsOptional, IsNumber, Min, Max, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class GetGymAccessHistoryDto {
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
	cedula?: string;

	@IsOptional()
	@IsString()
	clientName?: string;

	@IsOptional()
	@Transform(({ value }) => value === "true")
	successful?: boolean;
}
import { IsString, IsNotEmpty, IsNumber, Min, IsBoolean, IsOptional } from "class-validator";

export class CreateRewardDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsString()
	@IsNotEmpty()
	description!: string;

	@IsNumber()
	@Min(1)
	requiredDays!: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean = true;
}
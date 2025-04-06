import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class PageDto {
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page = 1;

	@Type(() => Number)
	@IsNumber()
	@Min(1)
	limit = 5;
}

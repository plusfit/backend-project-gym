import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

import { Hour } from "../intefaces/hour.interface";
export class CreateConfigDto {
	@IsNotEmpty()
	@ApiProperty()
	schedule: Hour[] | undefined;
}

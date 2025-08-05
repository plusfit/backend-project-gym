import { PartialType } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsNumber, IsDate } from "class-validator";
import { Type } from "class-transformer";

import { CreateClientDto } from "./create-client.dto";

export class UpdateClientDto extends PartialType(CreateClientDto) {
    @IsOptional()
    @IsBoolean()
    isOnboardingCompleted?: boolean;

    @IsOptional()
    @IsNumber()
    totalDays?: number;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    lastCheckIn?: Date;
}

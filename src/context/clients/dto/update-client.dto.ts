import { PartialType } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional } from "class-validator";

import { CreateClientDto } from "./create-client.dto";

export class UpdateClientDto extends PartialType(CreateClientDto) {
    @IsOptional()
    @IsBoolean()
    isOnboardingCompleted?: boolean;

    @IsOptional()
    @IsNumber()
    availablePoints?: number;
}

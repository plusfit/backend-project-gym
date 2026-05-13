import { ApiProperty } from "@nestjs/swagger";
import { IsDefined } from "class-validator";

export class BulkUploadResponseDto {
    @ApiProperty({
        description: "Batch ID from notifications-service",
        example: "507f1f77bcf86cd799439011",
    })
    @IsDefined()
    batchId!: string;

    @ApiProperty({
        description: "Total number of rows in the CSV",
        example: 50,
    })
    @IsDefined()
    total!: number;
}
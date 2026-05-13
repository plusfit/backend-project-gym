import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEnum, IsNumber, IsString } from "class-validator";

export enum BulkStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
}

export class BulkStatusResponseDto {
    @ApiProperty({
        description: "Batch ID",
        example: "507f1f77bcf86cd799439011",
    })
    @IsString()
    @IsDefined()
    batchId!: string;

    @ApiProperty({
        description: "Batch status",
        enum: BulkStatus,
        example: BulkStatus.PROCESSING,
    })
    @IsEnum(BulkStatus)
    @IsDefined()
    status!: BulkStatus;

    @ApiProperty({
        description: "Total rows in the batch",
        example: 50,
    })
    @IsNumber()
    @IsDefined()
    totalRows!: number;

    @ApiProperty({
        description: "Processed rows so far",
        example: 25,
    })
    @IsNumber()
    @IsDefined()
    processedRows!: number;

    @ApiProperty({
        description: "Successfully sent messages",
        example: 23,
    })
    @IsNumber()
    @IsDefined()
    successCount!: number;

    @ApiProperty({
        description: "Failed messages",
        example: 2,
    })
    @IsNumber()
    @IsDefined()
    failureCount!: number;
}
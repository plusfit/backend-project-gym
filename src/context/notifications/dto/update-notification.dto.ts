import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";

import { NotificationStatus } from "../schemas/notification.schema";

export class UpdateNotificationDto {
    @ApiProperty({
        description: "Client ID",
        example: "507f1f77bcf86cd799439011",
        required: false,
    })
    @IsOptional()
    @IsMongoId()
    clientId?: string;

    @ApiProperty({
        description: "Notification name",
        example: "Payment reminder",
        required: false,
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: "Reason for the notification",
        example: "Monthly payment due",
        required: false,
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiProperty({
        description: "Notification status",
        enum: NotificationStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(NotificationStatus)
    status?: NotificationStatus;
}

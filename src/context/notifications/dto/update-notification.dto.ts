import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";

import { NotificationReason, NotificationStatus } from "../schemas/notification.schema";

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
        enum: NotificationReason,
        required: false,
    })
    @IsOptional()
    @IsEnum(NotificationReason)
    reason?: NotificationReason;

    @ApiProperty({
        description: "Client phone number",
        example: "+598 99 123 456",
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        description: "Notification status",
        enum: NotificationStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(NotificationStatus)
    status?: NotificationStatus;
}

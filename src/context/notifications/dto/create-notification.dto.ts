import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { NotificationReason, NotificationStatus } from "../schemas/notification.schema";

export class CreateNotificationDto {
    @ApiProperty({
        description: "Client ID",
        example: "507f1f77bcf86cd799439011",
    })
    @IsNotEmpty()
    @IsMongoId()
    clientId?: string;

    @ApiProperty({
        description: "Notification name",
        example: "Payment reminder",
    })
    @IsNotEmpty()
    @IsString()
    name?: string;

    @ApiProperty({
        description: "Reason for the notification",
        enum: NotificationReason,
        example: NotificationReason.INACTIVITY,
    })
    @IsNotEmpty()
    @IsEnum(NotificationReason)
    reason?: NotificationReason;

    @ApiProperty({
        description: "Client phone number",
        example: "+598 99 123 456",
        required: false,
    })
    @IsString()
    phone?: string;

    @ApiProperty({
        description: "Notification status",
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
        required: false,
    })
    @IsEnum(NotificationStatus)
    status?: NotificationStatus;
}

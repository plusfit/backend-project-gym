import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from "class-validator";

import { NotificationStatus } from "../schemas/notification.schema";

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
        example: "Monthly payment due",
    })
    @IsNotEmpty()
    @IsString()
    reason?: string;

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

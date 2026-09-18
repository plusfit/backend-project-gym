import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class RegisterPushTokenDto {
	@ApiProperty({
		description: "Device token issued by the push provider",
		example: "fGx9_kQ2:APA91bH-device-token",
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(4096)
	token!: string;

	@ApiPropertyOptional({
		description: "Browser or device description, to help the client recognize it",
	})
	@IsOptional()
	@IsString()
	@MaxLength(512)
	userAgent?: string;
}

export class UpdateNotificationPreferencesDto {
	@ApiProperty({
		description:
			"Opt-in flag per reminder rule key. Only the rules present are changed; unknown keys are rejected.",
		example: { paymentDue: false },
	})
	@IsObject()
	preferences!: Record<string, boolean>;
}

/** Shape returned to the client: every known rule with its effective value. */
export class NotificationPreferencesResponseDto {
	@ApiProperty({ example: { routineDay: true, paymentDue: false, pointsNearReward: true } })
	@IsObject()
	@IsBoolean({ each: true })
	preferences!: Record<string, boolean>;
}

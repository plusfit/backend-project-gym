import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import {
	RegisterPushTokenDto,
	UpdateNotificationPreferencesDto,
} from "@/src/context/clients/dto/push-notifications.dto";
import { PushTokensService } from "@/src/context/clients/services/push-tokens.service";
import { CurrentUser } from "@/src/context/shared/guards/roles/current-user.decorator";

/**
 * Self-service endpoints: a client manages only their own devices and
 * preferences. The client id always comes from the token, never from the body,
 * so one person cannot register a device against another account.
 */
@ApiTags("clients")
@Controller("clients/me")
export class PushTokensController {
	constructor(private readonly pushTokensService: PushTokensService) {}

	@Post("push-tokens")
	@ApiOperation({ summary: "Register this device to receive push notifications" })
	@ApiResponse({ status: 201, description: "Device registered" })
	async registerToken(
		@CurrentUser("_id") clientId: string,
		@Body() dto: RegisterPushTokenDto,
	) {
		await this.pushTokensService.registerToken(clientId, dto.token, dto.userAgent);
		return { registered: true };
	}

	@Delete("push-tokens/:token")
	@ApiOperation({ summary: "Stop sending push notifications to this device" })
	async removeToken(@CurrentUser("_id") clientId: string, @Param("token") token: string) {
		await this.pushTokensService.removeToken(clientId, token);
		return { removed: true };
	}

	@Get("notification-preferences")
	@ApiOperation({ summary: "Read which reminders this client receives" })
	async getPreferences(@CurrentUser("_id") clientId: string) {
		return { preferences: await this.pushTokensService.getPreferences(clientId) };
	}

	@Patch("notification-preferences")
	@ApiOperation({ summary: "Turn individual reminders on or off" })
	async updatePreferences(
		@CurrentUser("_id") clientId: string,
		@Body() dto: UpdateNotificationPreferencesDto,
	) {
		return {
			preferences: await this.pushTokensService.updatePreferences(clientId, dto.preferences),
		};
	}
}

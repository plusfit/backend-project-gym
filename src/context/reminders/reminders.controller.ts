import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ReminderSettingsService } from "@/src/context/reminders/reminder-settings.service";
import { reminderCatalog } from "@/src/context/reminders/rules/registry";
import { RuleSettings } from "@/src/context/reminders/rules/reminder-rule";
import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

@ApiTags("reminders")
@Controller("reminders")
export class RemindersController {
	constructor(private readonly settingsService: ReminderSettingsService) {}

	/**
	 * Describes the available rules so the dashboard and the client app can
	 * render their controls without hardcoding them. Adding a rule therefore
	 * needs no front-end change.
	 */
	@Get("catalog")
	@ApiOperation({ summary: "List the reminder rules and their tunables" })
	getCatalog() {
		return { rules: reminderCatalog() };
	}

	@Get("settings")
	@ApiOperation({ summary: "Read the gym-wide reminder configuration" })
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	async getSettings() {
		return { settings: await this.settingsService.getSettings() };
	}

	@Patch("settings")
	@ApiOperation({ summary: "Enable, disable or tune reminder rules" })
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	async updateSettings(@Body() body: { settings: Record<string, Partial<RuleSettings>> }) {
		return { settings: await this.settingsService.updateSettings(body.settings ?? {}) };
	}
}

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Client, ClientSchema } from "@/src/context/clients/schemas/client.schema";
import { NotificationsModule } from "@/src/context/notifications/notifications.module";
import { ReminderSettingsService } from "@/src/context/reminders/reminder-settings.service";
import { RemindersController } from "@/src/context/reminders/reminders.controller";
import { RemindersCronService } from "@/src/context/reminders/reminders-cron.service";
import {
	ReminderDispatch,
	ReminderDispatchSchema,
} from "@/src/context/reminders/schemas/reminder-dispatch.schema";
import {
	ReminderSettings,
	ReminderSettingsSchema,
} from "@/src/context/reminders/schemas/reminder-settings.schema";
import { TokenCleanupService } from "@/src/context/reminders/token-cleanup.service";
import { Reward, RewardSchema } from "@/src/context/rewards/schemas/reward.schema";
import { Routine, RoutineSchema } from "@/src/context/routines/schemas/routine.schema";
import {
	SubRoutine,
	SubRoutineSchema,
} from "@/src/context/routines/schemas/sub-routine.schema";
import { Schedule, ScheduleSchema } from "@/src/context/schedules/schemas/schedule.schema";

/**
 * Automated reminders: the rules, their configuration, and the two crons that
 * send them and clean up after them.
 *
 * It reads from several contexts but owns no domain of its own, which is why it
 * registers the schemas it needs read-only rather than depending on each
 * module's service.
 */
@Module({
	imports: [
		NotificationsModule,
		MongooseModule.forFeature([
			{ name: ReminderSettings.name, schema: ReminderSettingsSchema },
			{ name: ReminderDispatch.name, schema: ReminderDispatchSchema },
			{ name: Client.name, schema: ClientSchema },
			{ name: Schedule.name, schema: ScheduleSchema },
			{ name: Routine.name, schema: RoutineSchema },
			{ name: SubRoutine.name, schema: SubRoutineSchema },
			{ name: Reward.name, schema: RewardSchema },
		]),
	],
	controllers: [RemindersController],
	providers: [ReminderSettingsService, RemindersCronService, TokenCleanupService],
	exports: [ReminderSettingsService],
})
export class RemindersModule {}

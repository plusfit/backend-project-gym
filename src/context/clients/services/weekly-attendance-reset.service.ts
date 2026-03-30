import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientDocument } from '../schemas/client.schema';

@Injectable()
export class WeeklyAttendanceResetService {
	private readonly logger = new Logger(WeeklyAttendanceResetService.name);

	constructor(
		@InjectModel('Client')
		private readonly clientModel: Model<ClientDocument>,
	) {}

	/**
	 * Cron job that runs every Sunday at 00:00 (midnight) Montevideo time
	 * Resets all clients' weeklyAttendance to 0
	 * Timezone: America/Montevideo (UTC-3)
	 *
	 * Cron expression: '0 0 * * 0'
	 * - 0: minute 0
	 * - 0: hour 0 (midnight)
	 * - *: any day of the month
	 * - *: any month
	 * - 0: Sunday
	 */
	@Cron("0 0 * * 0", {
		timeZone: 'America/Montevideo',
	})
	async resetWeeklyAttendance(): Promise<void> {
		try {
			const now = new Date();
			const montevideoTime = now.toLocaleString('es-UY', {
				timeZone: 'America/Montevideo',
				dateStyle: 'full',
				timeStyle: 'long',
			});

			this.logger.log(`Starting weekly attendance reset at ${montevideoTime}...`);

			const result = await this.clientModel.updateMany(
				{ weeklyAttendance: { $gt: 0 } },
				{ $set: { weeklyAttendance: 0 } },
			);

			this.logger.log(`Weekly attendance reset complete. Clients updated: ${result.modifiedCount}`);
		} catch (error) {
			this.logger.error('Error resetting weekly attendance', { error });
		}
	}
}

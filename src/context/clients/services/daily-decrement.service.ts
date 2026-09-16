import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';

import { ClientsService } from '../clients.service';
import { ClientDocument } from '../schemas/client.schema';

@Injectable()
export class DailyDecrementService {
	private readonly logger = new Logger(DailyDecrementService.name);

	constructor(
		@InjectModel('Client')
		private readonly clientModel: Model<ClientDocument>,
		@Inject(forwardRef(() => ClientsService))
		private readonly clientsService: ClientsService,
	) {}

	/**
	 * Cron job that runs daily at 00:00 (midnight) Montevideo time to decrement available days
	 * Decrements available days for all active clients, allowing negative values to track overdue days.
	 * If a client exceeds 15 days overdue, they are automatically disabled.
	 * Timezone: America/Montevideo (UTC-3)
	 */
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
		timeZone: 'America/Montevideo'
	})
	async decrementAvailableDays(): Promise<void> {
		try {
			const now = new Date();
			const montevideoTime = now.toLocaleString('es-UY', { 
				timeZone: 'America/Montevideo',
				dateStyle: 'full',
				timeStyle: 'long'
			});
			
			this.logger.log(`Starting daily decrement of available days at ${montevideoTime}...`);

			// Find all active clients
			const activeClients = await this.clientModel.find({
				disabled: { $ne: true } // Only process active clients
			});

			let decrementedCount = 0;
			let expiredCount = 0;
			let autoDisabledCount = 0;

			// Process each client
			for (const client of activeClients) {
				const currentDays = client.availableDays || 0;
				const newDays = currentDays - 1; // Allow negative values for tracking overdue days

				if (newDays < -15) {
					// Client is more than 15 days overdue, disable automatically
					this.logger.log(`Auto-disabling client ${client.userInfo?.name || client.email} as they are more than 15 days overdue.`);
					await this.clientsService.toggleDisabled(client._id.toString(), true);
					autoDisabledCount++;
				} else {
					// Update the client's available days
					await this.clientModel.updateOne(
						{ _id: client._id },
						{ 
							$set: { 
								availableDays: newDays,
								updatedAt: new Date()
							}
						}
					);

					decrementedCount++;

					// Check if client just expired (reached 0 days)
					if (newDays === 0 && currentDays > 0) {
						expiredCount++;
					}

					this.logger.debug(`Client ${client.userInfo?.name || client.email}: ${currentDays} → ${newDays} days`);
				}
			}

			this.logger.log(`Daily decrement completed: ${decrementedCount} clients decremented, ${expiredCount} expired today, ${autoDisabledCount} auto-disabled`);

		} catch (error) {
			this.logger.error('Error during daily decrement of available days', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			});
		}
	}

	/**
	 * Manual method to decrement days - useful for testing or manual operations
	 * @param clientId - Specific client ID to decrement, or null for all clients
	 */
	async manualDecrement(clientId?: string): Promise<{ processed: number; expired: number; autoDisabled: number }> {
		try {
			const filter: any = {
				disabled: { $ne: true }
			};

			if (clientId) {
				filter._id = clientId;
			}

			const clients = await this.clientModel.find(filter);
			
			let processed = 0;
			let expired = 0;
			let autoDisabled = 0;

			for (const client of clients) {
				const currentDays = client.availableDays || 0;
				const newDays = currentDays - 1;

				if (newDays < -15) {
					this.logger.log(`Auto-disabling client ${client.userInfo?.name || client.email} via manual decrement.`);
					await this.clientsService.toggleDisabled(client._id.toString(), true);
					autoDisabled++;
				} else {
					await this.clientModel.updateOne(
						{ _id: client._id },
						{ 
							$set: { 
								availableDays: newDays,
								updatedAt: new Date()
							}
						}
					);

					processed++;

					if (newDays === 0 && currentDays > 0) {
						expired++;
					}
				}
			}

			const logMessage = clientId 
				? `Manual decrement for client ${clientId}: ${processed} processed, ${expired} expired, ${autoDisabled} auto-disabled`
				: `Manual decrement executed: ${processed} processed, ${expired} expired, ${autoDisabled} auto-disabled`;
			
			this.logger.log(logMessage);
			
			return { processed, expired, autoDisabled };

		} catch (error) {
			this.logger.error('Error during manual decrement', error instanceof Error ? error : String(error));
			throw error;
		}
	}

	/**
	 * Get statistics about clients' available days
	 */
	async getAvailableDaysStats(): Promise<{
		totalClients: number;
		clientsWithDays: number;
		expiredClients: number;
		averageDays: number;
		dayDistribution: { range: string; count: number }[];
	}> {
		try {
			const [totalClients, clientsWithDays, expiredClients] = await Promise.all([
				this.clientModel.countDocuments({ disabled: { $ne: true } }),
				this.clientModel.countDocuments({ 
					availableDays: { $gt: 0 }, 
					disabled: { $ne: true } 
				}),
				this.clientModel.countDocuments({ 
					availableDays: { $lte: 0 }, 
					disabled: { $ne: true } 
				})
			]);

			// Calculate average days
			const avgResult = await this.clientModel.aggregate([
				{ $match: { disabled: { $ne: true } } },
				{ $group: { _id: null, avgDays: { $avg: '$availableDays' } } }
			]);
			const averageDays = avgResult[0]?.avgDays || 0;

			// Day distribution
			const distribution = await this.clientModel.aggregate([
				{ $match: { disabled: { $ne: true } } },
				{
					$bucket: {
						groupBy: '$availableDays',
						boundaries: [-1000, 0, 1, 31, 91, 181, 366],
						default: '365+',
						output: { count: { $sum: 1 } }
					}
				}
			]);

			const dayDistribution = distribution.map(bucket => {
				let range: string;
				if (bucket._id === -1000) range = 'Overdue';
				else if (bucket._id === 0) range = '0 days';
				else if (bucket._id === 1) range = '1-30 days';
				else if (bucket._id === 31) range = '31-90 days';
				else if (bucket._id === 91) range = '91-180 days';
				else if (bucket._id === 181) range = '181-365 days';
				else range = '365+ days';

				return { range, count: bucket.count };
			});

			return {
				totalClients,
				clientsWithDays,
				expiredClients,
				averageDays: Math.round(averageDays * 100) / 100,
				dayDistribution
			};

		} catch (error) {
			this.logger.error('Error getting available days stats', error instanceof Error ? error : String(error));
			throw error;
		}
	}
}
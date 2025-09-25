import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientDocument } from '../schemas/client.schema';

@Injectable()
export class DailyDecrementService {
	private readonly logger = new Logger(DailyDecrementService.name);

	constructor(
		@InjectModel('Client')
		private readonly clientModel: Model<ClientDocument>,
	) {}

	/**
	 * Cron job that runs daily at 00:00 (midnight) to decrement available days
	 * Only decrements if availableDays > 0, never goes below 0
	 */
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async decrementAvailableDays(): Promise<void> {
		try {
			this.logger.log('Starting daily decrement of available days...');

			// Find all clients that have available days > 0
			const clientsWithAvailableDays = await this.clientModel.find({
				availableDays: { $gt: 0 },
				disabled: { $ne: true } // Only process active clients
			});

			this.logger.log(`Found ${clientsWithAvailableDays.length} clients with available days > 0`);

			let decrementedCount = 0;
			let expiredCount = 0;

			// Process each client
			for (const client of clientsWithAvailableDays) {
				const currentDays = client.availableDays || 0;
				const newDays = Math.max(0, currentDays - 1); // Ensure never goes below 0

				// Update the client
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

				// Check if client expired (reached 0 days)
				if (newDays === 0 && currentDays > 0) {
					expiredCount++;
					this.logger.warn(`Client ${client.userInfo?.name || client.email} has expired (0 days remaining)`);
				}

				this.logger.debug(`Client ${client.userInfo?.name || client.email}: ${currentDays} → ${newDays} days`);
			}

			this.logger.log(`Daily decrement completed: ${decrementedCount} clients processed, ${expiredCount} expired`);

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
	async manualDecrement(clientId?: string): Promise<{ processed: number; expired: number }> {
		try {
			const filter: any = {
				availableDays: { $gt: 0 },
				disabled: { $ne: true }
			};

			if (clientId) {
				filter._id = clientId;
			}

			const clients = await this.clientModel.find(filter);
			
			let processed = 0;
			let expired = 0;

			for (const client of clients) {
				const currentDays = client.availableDays || 0;
				const newDays = Math.max(0, currentDays - 1);

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

			const logMessage = clientId 
				? `Manual decrement for client ${clientId}: ${processed} processed, ${expired} expired`
				: `Manual decrement executed: ${processed} processed, ${expired} expired`;
			
			this.logger.log(logMessage);
			
			return { processed, expired };

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
					availableDays: 0, 
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
						boundaries: [0, 1, 31, 91, 181, 366],
						default: '365+',
						output: { count: { $sum: 1 } }
					}
				}
			]);

			const dayDistribution = distribution.map(bucket => {
				let range: string;
				if (bucket._id === 0) range = '0 days';
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
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { ClientDocument } from '../schemas/client.schema';

@Injectable()
export class YearlyPointsResetService {
	private readonly logger = new Logger(YearlyPointsResetService.name);

	constructor(
		@InjectModel('Client')
		private readonly clientModel: Model<ClientDocument>,
	) {}

	/**
	 * Cron job that runs on January 1st at 00:00 (midnight) Montevideo time
	 * Resets all clients' availablePoints to 0
	 * Timezone: America/Montevideo (UTC-3)
	 * 
	 * Cron expression: '0 0 1 1 *'
	 * - 0: minute 0
	 * - 0: hour 0 (midnight)
	 * - 1: day 1 of the month
	 * - 1: January
	 * - *: any day of the week
	 */
	@Cron('0 0 1 1 *', {
		timeZone: 'America/Montevideo'
	})
	async resetAllClientPoints(): Promise<void> {
		try {
			const now = new Date();
			const montevideoTime = now.toLocaleString('es-UY', { 
				timeZone: 'America/Montevideo',
				dateStyle: 'full',
				timeStyle: 'long'
			});
			
			this.logger.log(`Starting yearly points reset at ${montevideoTime}...`);

			// Find all clients that have available points > 0
			const clientsWithPoints = await this.clientModel.find({
				availablePoints: { $gt: 0 },
				disabled: { $ne: true } // Only process active clients
			});

			let resetCount = 0;
			let totalPointsReset = 0;

			// Process each client
			for (const client of clientsWithPoints) {
				const currentPoints = client.availablePoints || 0;

				// Update the client
				await this.clientModel.updateOne(
					{ _id: client._id },
					{ 
						$set: { 
							availablePoints: 0,
							updatedAt: new Date()
						}
					}
				);

				resetCount++;
				totalPointsReset += currentPoints;

				this.logger.debug(`Client ${client.userInfo?.name || client.email}: ${currentPoints} → 0 points`);
			}

			this.logger.log(`Yearly points reset completed: ${resetCount} clients processed, ${totalPointsReset} total points reset to 0`);

		} catch (error) {
			this.logger.error('Error during yearly points reset', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			});
		}
	}

	/**
	 * Manual method to reset points - useful for testing or manual operations
	 * @param clientId - Specific client ID to reset, or null for all clients
	 */
	async manualReset(clientId?: string): Promise<{ processed: number; totalPointsReset: number }> {
		try {
			const filter: any = {
				availablePoints: { $gt: 0 },
				disabled: { $ne: true }
			};

			if (clientId) {
				filter._id = clientId;
			}

			const clients = await this.clientModel.find(filter);
			
			let processed = 0;
			let totalPointsReset = 0;

			for (const client of clients) {
				const currentPoints = client.availablePoints || 0;

				await this.clientModel.updateOne(
					{ _id: client._id },
					{ 
						$set: { 
							availablePoints: 0,
							updatedAt: new Date()
						}
					}
				);

				processed++;
				totalPointsReset += currentPoints;
			}

			const logMessage = clientId 
				? `Manual points reset for client ${clientId}: ${processed} processed, ${totalPointsReset} points reset`
				: `Manual points reset executed: ${processed} processed, ${totalPointsReset} points reset`;
			
			this.logger.log(logMessage);
			
			return { processed, totalPointsReset };

		} catch (error) {
			this.logger.error('Error during manual points reset', error instanceof Error ? error : String(error));
			throw error;
		}
	}

	/**
	 * Get statistics about clients' available points
	 */
	async getPointsStats(): Promise<{
		totalClients: number;
		clientsWithPoints: number;
		clientsWithoutPoints: number;
		totalPoints: number;
		averagePoints: number;
	}> {
		try {
			const [totalClients, clientsWithPoints, clientsWithoutPoints] = await Promise.all([
				this.clientModel.countDocuments({ disabled: { $ne: true } }),
				this.clientModel.countDocuments({ 
					availablePoints: { $gt: 0 }, 
					disabled: { $ne: true } 
				}),
				this.clientModel.countDocuments({ 
					$or: [
						{ availablePoints: 0 },
						{ availablePoints: { $exists: false } }
					],
					disabled: { $ne: true } 
				})
			]);

			// Calculate total and average points
			const pointsResult = await this.clientModel.aggregate([
				{ $match: { disabled: { $ne: true } } },
				{ 
					$group: { 
						_id: null, 
						totalPoints: { $sum: { $ifNull: ['$availablePoints', 0] } },
						avgPoints: { $avg: { $ifNull: ['$availablePoints', 0] } }
					} 
				}
			]);

			const totalPoints = pointsResult[0]?.totalPoints || 0;
			const averagePoints = pointsResult[0]?.avgPoints || 0;

			return {
				totalClients,
				clientsWithPoints,
				clientsWithoutPoints,
				totalPoints,
				averagePoints: Math.round(averagePoints * 100) / 100
			};

		} catch (error) {
			this.logger.error('Error getting points stats', error instanceof Error ? error : String(error));
			throw error;
		}
	}
}

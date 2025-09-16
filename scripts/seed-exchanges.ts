/**
 * Seed script for exchanges data
 * Run with: npm run seed:exchanges
 */

import { Injectable, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Client, ClientSchema } from "../src/context/clients/schemas/client.schema";
import { Exchange, ExchangeSchema } from "../src/context/rewards/schemas/exchange.schema";
import { Reward, RewardSchema } from "../src/context/rewards/schemas/reward.schema";

@Injectable()
class SeedService {
	constructor(
		@InjectModel(Exchange.name)
		private readonly exchangeModel: Model<Exchange>,
		@InjectModel(Reward.name)
		private readonly rewardModel: Model<Reward>,
		@InjectModel(Client.name)
		private readonly clientModel: Model<Client>,
	) {}

	async seedExchanges() {
		console.log("🔄 Seeding exchanges data...");

		try {
			// Get existing rewards
			const rewards = await this.rewardModel.find({ enabled: true }).exec();
			if (rewards.length === 0) {
				console.log("⚠️  No rewards found. Please run seed:rewards first.");
				return;
			}

			// Get existing clients or create test clients
			let clients = await this.clientModel.find().limit(10).exec();
			
			// If no clients exist, create some test clients
			if (clients.length === 0) {
				console.log("👤 Creating test clients for exchanges...");
				const testClients = await this.createTestClients();
				clients = testClients;
			}

			console.log(`🎁 Found ${rewards.length} rewards and ${clients.length} clients`);

			// Generate exchanges data
			const exchangesData = this.generateExchangesData(rewards, clients);

			// Seed exchanges
			for (const exchangeData of exchangesData) {
				try {
					// Check if exchange already exists (avoid duplicates by checking similar data)
					const existingExchange = await this.exchangeModel.findOne({
						rewardId: exchangeData.rewardId,
						clientId: exchangeData.clientId,
						exchangeDate: exchangeData.exchangeDate
					}).exec();
					
					if (existingExchange) {
						console.log(`⏭️  Exchange already exists: ${exchangeData.clientName} - ${exchangeData.rewardName}`);
						continue;
					}

					// Create new exchange
					const exchange = new this.exchangeModel(exchangeData);
					await exchange.save();
					
					console.log(`✅ Created exchange: ${exchangeData.clientName} canjeó ${exchangeData.rewardName} (${exchangeData.pointsUsed} points)`);
				} catch (error: any) {
					console.error(`❌ Error creating exchange for ${exchangeData.clientName}:`, error.message || error);
				}
			}

			console.log("🎉 Exchanges seeding completed!");
		} catch (error: any) {
			console.error("❌ Error in seeding process:", error.message || error);
		}
	}

	private async createTestClients() {
		const testClientsData = [
			{
				email: "juan.perez@example.com",
				role: "User",
				planId: "plan_basic",
				userInfo: {
					name: "Juan Pérez",
					phone: "+1234567890",
					sex: "M",
				},
				availablePoints: 1200,
				totalAccesses: 45,
				consecutiveDays: 12,
			},
			{
				email: "maria.garcia@example.com",
				role: "User", 
				planId: "plan_premium",
				userInfo: {
					name: "María García",
					phone: "+1234567891",
					sex: "F",
				},
				availablePoints: 800,
				totalAccesses: 32,
				consecutiveDays: 8,
			},
			{
				email: "carlos.rodriguez@example.com",
				role: "User",
				planId: "plan_basic",
				userInfo: {
					name: "Carlos Rodríguez",
					phone: "+1234567892",
					sex: "M",
				},
				availablePoints: 1500,
				totalAccesses: 67,
				consecutiveDays: 20,
			},
			{
				email: "ana.martinez@example.com",
				role: "User",
				planId: "plan_vip",
				userInfo: {
					name: "Ana Martínez",
					phone: "+1234567893",
					sex: "F",
				},
				availablePoints: 2000,
				totalAccesses: 89,
				consecutiveDays: 25,
			},
			{
				email: "luis.lopez@example.com",
				role: "User",
				planId: "plan_basic",
				userInfo: {
					name: "Luis López",
					phone: "+1234567894",
					sex: "M",
				},
				availablePoints: 650,
				totalAccesses: 23,
				consecutiveDays: 5,
			}
		];

		const createdClients = [];
		for (const clientData of testClientsData) {
			try {
				// Check if client already exists
				const existingClient = await this.clientModel.findOne({ email: clientData.email }).exec();
				if (existingClient) {
					createdClients.push(existingClient);
					continue;
				}

				const client = new this.clientModel(clientData);
				const savedClient = await client.save();
				createdClients.push(savedClient);
				console.log(`👤 Created test client: ${clientData.userInfo.name}`);
			} catch (error: any) {
				console.error(`❌ Error creating test client ${clientData.userInfo.name}:`, error.message);
			}
		}

		return createdClients;
	}

	private generateExchangesData(rewards: any[], clients: any[]) {
		const exchanges = [];
		const statuses = ['completed', 'completed', 'completed', 'pending', 'completed']; // Mostly completed
		
		// Generate multiple exchanges with different dates
		for (let i = 0; i < 25; i++) {
			const reward = rewards[Math.floor(Math.random() * rewards.length)];
			const client = clients[Math.floor(Math.random() * clients.length)];
			const status = statuses[Math.floor(Math.random() * statuses.length)];
			
			// Generate dates in the last 3 months
			const exchangeDate = new Date();
			exchangeDate.setDate(exchangeDate.getDate() - Math.floor(Math.random() * 90));

			exchanges.push({
				rewardId: reward._id.toString(),
				rewardName: reward.name,
				clientId: client._id.toString(),
				clientName: client.userInfo?.name || client.email.split('@')[0],
				clientEmail: client.email,
				pointsUsed: reward.pointsRequired,
				exchangeDate: exchangeDate,
				status: status,
			});
		}

		// Sort by date (most recent first)
		exchanges.sort((a, b) => b.exchangeDate.getTime() - a.exchangeDate.getTime());

		return exchanges;
	}
}

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get<string>("MONGODB_URI"),
			}),
			inject: [ConfigService],
		}),
		MongooseModule.forFeature([
			{ name: Exchange.name, schema: ExchangeSchema },
			{ name: Reward.name, schema: RewardSchema },
			{ name: Client.name, schema: ClientSchema },
		]),
	],
	providers: [SeedService],
})
class SeedModule {}

async function seedExchanges() {
	try {
		const { NestFactory } = await import("@nestjs/core");
		const app = await NestFactory.createApplicationContext(SeedModule);
		const seedService = app.get(SeedService);

		await seedService.seedExchanges();
		await app.close();
	} catch (error) {
		console.error("❌ Error seeding exchanges:", error);
		process.exit(1);
	}
}

// Execute if this file is run directly
seedExchanges();
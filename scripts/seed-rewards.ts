/**
 * Seed script for default rewards
 * Run with: npm run seed:rewards
 */

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { RewardsModule } from "../src/context/rewards/rewards.module";
import { RewardsService } from "../src/context/rewards/rewards.service";

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
		RewardsModule,
	],
})
class SeedModule {}

const defaultRewards = [
	{
		name: "Guerrero de la Semana",
		description: "¡7 días consecutivos de entrenamiento! Tu disciplina está dando frutos.",
		requiredDays: 7,
		isActive: true,
	},
	{
		name: "Disciplina de Acero",
		description: "¡15 días consecutivos de dedicación! Tu constancia es admirable.",
		requiredDays: 15,
		isActive: true,
	},
	{
		name: "Campeón del Mes",
		description: "¡Un mes completo de entrenamiento! Eres un ejemplo de perseverancia.",
		requiredDays: 30,
		isActive: true,
	},
	{
		name: "Máquina Imparable",
		description: "¡2 meses consecutivos de constancia! Tu determinación es inspiradora.",
		requiredDays: 60,
		isActive: true,
	},
	{
		name: "Leyenda del Gimnasio",
		description: "¡3 meses consecutivos! Eres una verdadera inspiración para todos.",
		requiredDays: 90,
		isActive: true,
	},
];

async function seedRewards() {
	try {
		const { NestFactory } = await import("@nestjs/core");
		const app = await NestFactory.createApplicationContext(SeedModule);
		const rewardsService = app.get(RewardsService);

		console.log("🌱 Seeding default rewards...");

		for (const reward of defaultRewards) {
			try {
				const existingReward = await rewardsService.findByRequiredDays(reward.requiredDays);
				if (!existingReward) {
					await rewardsService.create(reward);
					console.log(`✅ Created reward: ${reward.name} (${reward.requiredDays} days)`);
				} else {
					console.log(`⏭️  Reward already exists: ${reward.name} (${reward.requiredDays} days)`);
				}
			} catch (error) {
				console.error(`❌ Error creating reward ${reward.name}:`, error);
			}
		}

		console.log("🎉 Rewards seeding completed!");
		await app.close();
	} catch (error) {
		console.error("❌ Error seeding rewards:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	seedRewards();
}
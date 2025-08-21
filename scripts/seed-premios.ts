/**
 * Seed script for default premios
 * Run with: npm run seed:premios
 */

import { Injectable,Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Premio, PremioSchema } from "../src/context/premios/schemas/premio.schema";

@Injectable()
class SeedService {
	constructor(
		@InjectModel(Premio.name)
		private readonly premioModel: Model<Premio>,
	) {}

	async seedPremios(premiosData: any[]) {
		console.log("🏆 Seeding default premios...");

		for (const premioData of premiosData) {
			try {
				// Check if premio already exists
				const existingPremio = await this.premioModel.findOne({ name: premioData.name }).exec();
				
				if (existingPremio) {
					console.log(`⏭️  Premio already exists: ${premioData.name} (${premioData.pointsRequired} points)`);
					continue;
				}

				// Create new premio
				const premio = new this.premioModel({
					...premioData,
					totalCanjes: 0,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
				
				await premio.save();
				console.log(`✅ Created premio: ${premioData.name} (${premioData.pointsRequired} points)`);
			} catch (error: any) {
				console.error(`❌ Error creating premio ${premioData.name}:`, error.message || error);
			}
		}

		console.log("🎉 Premios seeding completed!");
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
			{ name: Premio.name, schema: PremioSchema },
		]),
	],
	providers: [SeedService],
})
class SeedModule {}

const defaultPremios = [
	{
		name: "Botella de Agua Deportiva",
		description: "Botella reutilizable de 750ml con logo del gimnasio. Perfecta para mantenerte hidratado durante tus entrenamientos.",
		pointsRequired: 100,
		enabled: true,
	},
	{
		name: "Toalla de Gimnasio",
		description: "Toalla de microfibra absorbente y de secado rápido. Ideal para tus sesiones de entrenamiento.",
		pointsRequired: 250,
		enabled: true,
	},
	{
		name: "Shaker Proteínas",
		description: "Vaso mezclador con compartimento para suplementos. Incluye resorte mezclador para batidos perfectos.",
		pointsRequired: 300,
		enabled: true,
	},
	{
		name: "Guantes de Entrenamiento",
		description: "Guantes acolchados para proteger tus manos durante el levantamiento de pesas. Talla única ajustable.",
		pointsRequired: 400,
		enabled: true,
	},
	{
		name: "Clase Personal Training",
		description: "Sesión de entrenamiento personalizado de 1 hora con uno de nuestros entrenadores certificados.",
		pointsRequired: 500,
		enabled: true,
	},
	{
		name: "Camiseta del Gimnasio",
		description: "Camiseta deportiva de alta calidad con el logo del gimnasio. Disponible en varias tallas.",
		pointsRequired: 600,
		enabled: true,
	},
	{
		name: "Auriculares Deportivos",
		description: "Auriculares inalámbricos resistentes al sudor, perfectos para tus entrenamientos más intensos.",
		pointsRequired: 800,
		enabled: true,
	},
	{
		name: "Plan Nutricional Personalizado",
		description: "Consulta con nuestro nutricionista y plan alimentario personalizado por 1 mes.",
		pointsRequired: 1000,
		enabled: true,
	},
];

async function seedPremios() {
	try {
		const { NestFactory } = await import("@nestjs/core");
		const app = await NestFactory.createApplicationContext(SeedModule);
		const seedService = app.get(SeedService);

		await seedService.seedPremios(defaultPremios);
		await app.close();
	} catch (error) {
		console.error("❌ Error seeding premios:", error);
		process.exit(1);
	}
}

// Execute if this file is run directly
seedPremios();
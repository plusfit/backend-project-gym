import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { StepData } from "../schemas/onboarding.schema";
import { PLAN_REPOSITORY } from "../../plans/repositories/plans.repository";
import { PlanGoal, ExperienceLevel } from "../../shared/enums/plan.enum";
import { Plan } from "../../plans/schemas/plan.schema";

@Injectable()
export class PlanRecommendationService {
	constructor(
		@Inject(PLAN_REPOSITORY)
		private readonly plansRepository: any,
	) {}

	/**
	 * Encuentra el plan más adecuado basado en los datos de onboarding del usuario
	 */
	async findBestMatchingPlan(onboardingData: StepData): Promise<Plan> {
		if (!onboardingData || !onboardingData.step3) {
			throw new NotFoundException(
				"No se encontraron datos de entrenamiento para recomendar un plan",
			);
		}

		// Extraer datos relevantes del onboarding
		const { trainingDays, goal, trainingLevel } = onboardingData.step3;

		// Mapear el objetivo del formulario de onboarding al enum PlanGoal
		let planGoal = PlanGoal.GENERAL_FITNESS;
		switch (goal.toLowerCase()) {
			case "perder peso":
			case "bajar de peso":
			case "pérdida de peso":
				planGoal = PlanGoal.LOSE_WEIGHT;
				break;
			case "aumentar masa muscular":
			case "ganar músculo":
			case "hipertrofia":
				planGoal = PlanGoal.BUILD_MUSCLE;
				break;
			case "mejorar resistencia":
			case "resistencia cardiovascular":
				planGoal = PlanGoal.IMPROVE_CARDIO;
				break;
			case "aumentar flexibilidad":
			case "mejorar flexibilidad":
				planGoal = PlanGoal.INCREASE_FLEXIBILITY;
				break;
		}

		// Mapear el nivel de entrenamiento
		let experienceLevel = ExperienceLevel.BEGINNER;
		switch (trainingLevel.toLowerCase()) {
			case "principiante":
			case "beginner":
				experienceLevel = ExperienceLevel.BEGINNER;
				break;
			case "intermedio":
			case "intermediate":
				experienceLevel = ExperienceLevel.INTERMEDIATE;
				break;
			case "avanzado":
			case "advanced":
				experienceLevel = ExperienceLevel.ADVANCED;
				break;
		}

		// Construir los criterios de búsqueda para encontrar planes que coincidan
		const criteria = {
			days: { $lte: trainingDays }, // Planes con días menores o iguales a los días de entrenamiento deseados
			goal: planGoal,
			experienceLevel: experienceLevel,
		};

		// Obtener todos los planes que coincidan con los criterios
		const matchingPlans = await this.plansRepository.findPlans(criteria);

		if (!matchingPlans || matchingPlans.length === 0) {
			// Si no hay coincidencias exactas, buscar con criterios más relajados
			const relaxedCriteria = {
				days: { $lte: trainingDays + 1 }, // Permitir un día más
			};

			// Intentar encontrar planes con criterios relajados
			const alternativePlans =
				await this.plansRepository.findPlans(relaxedCriteria);

			if (!alternativePlans || alternativePlans.length === 0) {
				throw new NotFoundException(
					"No se encontraron planes que coincidan con tus preferencias",
				);
			}

			// De los planes alternativos, tomar el que mejor se ajuste al nivel y objetivo
			return this.rankPlans(
				alternativePlans,
				planGoal,
				experienceLevel,
				trainingDays,
			);
		}

		// De los planes que coinciden, tomar el que mejor se ajuste
		return this.rankPlans(
			matchingPlans,
			planGoal,
			experienceLevel,
			trainingDays,
		);
	}

	/**
	 * Ordena los planes según su relevancia para los criterios del usuario
	 */
	private rankPlans(
		plans: Plan[],
		goalPreference: string,
		levelPreference: string,
		daysPreference: number,
	): Plan {
		// Asignar puntuación a cada plan basado en qué tan bien coincide con las preferencias
		const scoredPlans = plans.map((plan) => {
			let score = 0;

			// Puntaje por coincidencia de objetivo (más importante)
			if (plan.goal === goalPreference) {
				score += 5;
			}

			// Puntaje por coincidencia de nivel
			if (plan.experienceLevel === levelPreference) {
				score += 3;
			}

			// Puntaje por coincidencia de días (preferimos planes con días iguales o un poco menos)
			const daysDiff = daysPreference - plan.days;
			if (daysDiff === 0) {
				score += 4; // Coincidencia exacta
			} else if (daysDiff === 1) {
				score += 3; // Un día menos
			} else if (daysDiff === 2) {
				score += 2; // Dos días menos
			} else if (daysDiff < 0) {
				score -= 1; // Penalizar si el plan requiere más días
			}

			return { plan, score };
		});

		// Ordenar planes por puntuación descendente
		scoredPlans.sort((a, b) => b.score - a.score);

		// Devolver el plan con la puntuación más alta
		return scoredPlans[0].plan;
	}
}

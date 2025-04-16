import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { StepData, TrainingPreferences } from "../schemas/onboarding.schema";
import { PLAN_REPOSITORY } from "../../plans/repositories/plans.repository";
import {
	PlanGoal,
	ExperienceLevel,
	PlanCategory,
	PlanType,
} from "../../shared/enums/plan.enum";
import { Plan } from "../../plans/schemas/plan.schema";

@Injectable()
export class PlanRecommendationService {
	constructor(
		@Inject(PLAN_REPOSITORY)
		private readonly plansRepository: any,
	) {}

	async recommendPlan(onboardingData: StepData): Promise<Plan> {
		this.validateOnboardingData(onboardingData);

		const criteria = this.buildSearchCriteria(onboardingData);
		let plans = await this.findMatchingPlans(criteria);

		if (plans.length === 0) {
			plans = await this.findRelaxedPlans(
				onboardingData.step3?.trainingDays || 0,
			);
		}

		return this.selectBestPlan(plans, onboardingData);
	}

	private validateOnboardingData(onboardingData: StepData): void {
		if (!onboardingData?.step3) {
			throw new NotFoundException(
				"No se encontraron datos de entrenamiento para recomendar un plan",
			);
		}

		if (!onboardingData?.step1?.dateOfBirth) {
			throw new NotFoundException(
				"No se encontró la fecha de nacimiento para recomendar un plan",
			);
		}
	}

	private buildSearchCriteria(onboardingData: StepData): Record<string, any> {
		const step3 = onboardingData.step3 as TrainingPreferences;
		const dateOfBirth = onboardingData.step1?.dateOfBirth || "";
		const clientAge = this.calculateAge(dateOfBirth);

		const goalMap: Record<string, PlanGoal> = {
			"perder peso": PlanGoal.LOSE_WEIGHT,
			"aumentar masa muscular": PlanGoal.BUILD_MUSCLE,
			"mejorar resistencia": PlanGoal.IMPROVE_CARDIO,
			"aumentar flexibilidad": PlanGoal.INCREASE_FLEXIBILITY,
		};

		const levelMap: Record<string, ExperienceLevel> = {
			principiante: ExperienceLevel.BEGINNER,
			intermedio: ExperienceLevel.INTERMEDIATE,
			avanzado: ExperienceLevel.ADVANCED,
		};

		// Determinar el tipo de plan preferido basado en el tipo de entrenamiento
		const trainingType = step3.trainingType || "";
		const preferredType = trainingType.toLowerCase().includes("cardio")
			? PlanType.CARDIO
			: PlanType.ROOM;

		return {
			days: { $lte: step3.trainingDays },
			goal:
				goalMap[step3.goal?.toLowerCase() || ""] || PlanGoal.GENERAL_FITNESS,
			experienceLevel:
				levelMap[step3.trainingLevel?.toLowerCase() || ""] ||
				ExperienceLevel.BEGINNER,
			// Filtrar por edad si está especificada
			$and: [
				{
					$or: [
						{ minAge: { $exists: false } },
						{ minAge: { $lte: clientAge } },
					],
				},
				{
					$or: [
						{ maxAge: { $exists: false } },
						{ maxAge: { $gte: clientAge } },
					],
				},
			],
			// Preferir el tipo de plan, pero no limitar estrictamente
			$or: [{ type: preferredType }, { type: PlanType.MIXED }],
		};
	}

	private async findMatchingPlans(
		criteria: Record<string, any>,
	): Promise<Plan[]> {
		return this.plansRepository.getPlans(0, 100, criteria) || [];
	}

	private async findRelaxedPlans(trainingDays: number): Promise<Plan[]> {
		return (
			this.plansRepository.getPlans(0, 100, {
				days: { $lte: trainingDays + 1 },
			}) || []
		);
	}

	private selectBestPlan(plans: Plan[], onboardingData: StepData): Plan {
		if (plans.length === 0) {
			throw new NotFoundException("No se encontraron planes disponibles");
		}

		return plans
			.map((plan) => ({
				plan,
				score: this.calculatePlanScore(plan, onboardingData),
			}))
			.sort((a, b) => b.score - a.score)[0].plan;
	}

	private calculatePlanScore(plan: Plan, onboardingData: StepData): number {
		const step3 = onboardingData.step3 as TrainingPreferences;
		const dateOfBirth = onboardingData.step1?.dateOfBirth || "";
		const clientAge = this.calculateAge(dateOfBirth);
		let score = 0;

		// Evaluación de objetivos
		if (plan.goal === step3.goal) score += 5;

		// Evaluación de nivel de experiencia
		if (plan.experienceLevel === step3.trainingLevel) score += 3;

		// Evaluación de días de entrenamiento
		const dayDiff = (step3.trainingDays || 0) - plan.days;
		if (dayDiff >= 0) score += 4 - dayDiff;
		else score -= 2; // Penaliza por requerir más días de entrenamiento.

		// Evaluación de tipo de plan
		const trainingType = step3.trainingType || "";
		const preferredType = trainingType.toLowerCase().includes("cardio")
			? PlanType.CARDIO
			: PlanType.ROOM;
		if (plan.type === preferredType) score += 4;
		else if (plan.type === PlanType.MIXED) score += 2;

		// Evaluación de categoría
		// Mapeo de objetivos a categorías
		const categoryMap: Record<string, PlanCategory> = {
			[PlanGoal.LOSE_WEIGHT]: PlanCategory.WEIGHT_LOSS,
			[PlanGoal.BUILD_MUSCLE]: PlanCategory.MUSCLE_GAIN,
			[PlanGoal.IMPROVE_CARDIO]: PlanCategory.ENDURANCE,
			[PlanGoal.INCREASE_FLEXIBILITY]: PlanCategory.FLEXIBILITY,
			[PlanGoal.GENERAL_FITNESS]: PlanCategory.GENERAL_WELLNESS,
		};

		const preferredCategory =
			categoryMap[plan.goal] || PlanCategory.GENERAL_WELLNESS;
		if (plan.category === preferredCategory) score += 3;

		// Evaluación de edad
		if (plan.minAge !== undefined && plan.maxAge !== undefined) {
			// Si el plan tiene un rango de edad y el cliente está dentro de ese rango
			if (clientAge >= plan.minAge && clientAge <= plan.maxAge) {
				score += 4;
			} else {
				// Penalizar si está fuera del rango pero no demasiado lejos
				const minAgeDiff = plan.minAge ? Math.abs(clientAge - plan.minAge) : 0;
				const maxAgeDiff = plan.maxAge ? Math.abs(clientAge - plan.maxAge) : 0;
				const ageDiff = Math.min(minAgeDiff, maxAgeDiff);

				if (ageDiff <= 5)
					score -= 1; // Ligeramente fuera del rango
				else if (ageDiff <= 10)
					score -= 2; // Moderadamente fuera del rango
				else score -= 3; // Muy fuera del rango
			}
		}

		return score;
	}

	private calculateAge(dateOfBirth: string): number {
		const birthDate = new Date(dateOfBirth);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const m = today.getMonth() - birthDate.getMonth();

		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}

		return age;
	}
}

import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { StepData, TrainingPreferences } from "../schemas/onboarding.schema";
import { PLAN_REPOSITORY } from "../../plans/repositories/plans.repository";
import {
  PlanGoal,
  PlanType,
  SexType,
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

    if (!onboardingData?.step1?.sex) {
      throw new NotFoundException(
        "No se encontró el sexo para recomendar un plan",
      );
    }
  }

  private buildSearchCriteria(onboardingData: StepData): Record<string, any> {
    const step3 = onboardingData.step3 as TrainingPreferences;
    const dateOfBirth = onboardingData.step1?.dateOfBirth || "";
    const clientSex = onboardingData.step1?.sex || "";
    const clientAge = this.calculateAge(dateOfBirth);

    const goalMap: Record<string, PlanGoal> = {
      "perder peso": PlanGoal.LOSE_WEIGHT,
      "aumentar masa muscular": PlanGoal.BUILD_MUSCLE,
      "mejorar resistencia": PlanGoal.IMPROVE_CARDIO,
      "aumentar flexibilidad": PlanGoal.INCREASE_FLEXIBILITY,
      "recuperación de lesiones": PlanGoal.INJURY_RECOVERY,
    };

    // Determine preferred plan type based on training type
    const trainingType = step3.trainingType || "";
    const preferredType = trainingType.toLowerCase().includes("cardio")
      ? PlanType.CARDIO
      : PlanType.ROOM;

    const criteria: Record<string, any> = {
      days: { $lte: step3.trainingDays },
      // Filter by age if specified
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
        // Filter by sex - include plans that don't specify sex or match client's sex
        {
          $or: [
            { SexType: { $exists: false } },
            { SexType: null },
            { SexType: clientSex },
          ],
        },
      ],
      // Prefer plan type, but don't strictly limit
      $or: [{ type: preferredType }, { type: PlanType.MIXED }],
    };

    // If the goal is injury recovery and injury type is specified
    if (criteria.goal === PlanGoal.INJURY_RECOVERY && step3.injuryType) {
      criteria.injuryType = step3.injuryType;
    }

    return criteria;
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
    const clientSex = onboardingData.step1?.sex || "";
    const clientAge = this.calculateAge(dateOfBirth);
    let score = 0;

    // Training days evaluation
    const dayDiff = (step3.trainingDays || 0) - plan.days;
    if (dayDiff >= 0) score += 4 - dayDiff;
    else score -= 2; // Penalty for requiring more training days

    // Plan type evaluation
    const trainingType = step3.trainingType || "";
    const preferredType = trainingType.toLowerCase().includes("cardio")
      ? PlanType.CARDIO
      : PlanType.ROOM;
    if (plan.type === preferredType) score += 4;
    else if (plan.type === PlanType.MIXED) score += 2;

    // Sex evaluation
    if (plan.sexType) {
      if (plan.sexType === clientSex) {
        score += 3; // Bonus for sex match
      } else {
        score -= 1; // Small penalty for sex mismatch
      }
    }
    // No penalty if plan doesn't specify sex (neutral plans)

    // Injury type evaluation (if applicable)
    if (
      plan.goal === PlanGoal.INJURY_RECOVERY &&
      step3.injuryType &&
      plan.injuryType === step3.injuryType
    ) {
      score += 5; // High priority for injury type match
    }

    // Age evaluation
    if (plan.minAge !== undefined && plan.maxAge !== undefined) {
      // If plan has age range and client is within that range
      if (clientAge >= plan.minAge && clientAge <= plan.maxAge) {
        score += 4;
      } else {
        // Penalize if outside range but not too far
        const minAgeDiff = plan.minAge ? Math.abs(clientAge - plan.minAge) : 0;
        const maxAgeDiff = plan.maxAge ? Math.abs(clientAge - plan.maxAge) : 0;
        const ageDiff = Math.min(minAgeDiff, maxAgeDiff);

        if (ageDiff <= 5)
          score -= 1; // Slightly outside range
        else if (ageDiff <= 10)
          score -= 2; // Moderately outside range
        else score -= 3; // Far outside range
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

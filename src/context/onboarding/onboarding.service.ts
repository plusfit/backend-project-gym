import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { ClientsService } from "../clients/clients.service";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationStatus } from "../notifications/schemas/notification.schema";
import { Plan } from "../plans/schemas/plan.schema";
import { CreateOnboardingDto } from "./dto/create-onboarding.dto";
import { UpdateOnboardingDto } from "./dto/update-onboarding.dto";
import { OnboardingRepository } from "./repositories/onboarding.repository";
import { Onboarding, StepData } from "./schemas/onboarding.schema";
import { PlanRecommendationService } from "./services/plan-recommendation.service";

@Injectable()
export class OnboardingService {
	constructor(
		private readonly onboardingRepository: OnboardingRepository,
		private readonly planRecommendationService: PlanRecommendationService,
		@Inject(forwardRef(() => ClientsService))
		private readonly clientsService: ClientsService,
		private readonly notificationsService: NotificationsService,
	) { }

	async create(createOnboardingDto: CreateOnboardingDto): Promise<Onboarding> {
		const existing = await this.onboardingRepository.findByUserId(
			createOnboardingDto.userId,
		);
		if (existing) {
			throw new BadRequestException("El onboarding ya existe para este usuario");
		}

		return this.onboardingRepository.create(createOnboardingDto);
	}

	async findAll(): Promise<Onboarding[]> {
		return this.onboardingRepository.findAll();
	}

	async findByUserId(userId: string): Promise<Onboarding | null> {
		this.ensureUserIdProvided(userId);
		const onboarding = await this.onboardingRepository.findByUserId(userId);
		// if (!onboarding) {
		// 	throw new NotFoundException(`Onboarding not found for user ${userId}`);
		// }
		return onboarding || null;
	}

	async update(userId: string, dto: UpdateOnboardingDto): Promise<Onboarding> {
		this.ensureUserIdProvided(userId);
		const onboarding = await this.onboardingRepository.update(userId, dto);
		if (!onboarding) {
			throw new NotFoundException(`Onboarding not found for user ${userId}`);
		}
		return onboarding;
	}

	async remove(userId: string): Promise<Onboarding> {
		this.ensureUserIdProvided(userId);
		const onboarding = await this.onboardingRepository.remove(userId);
		if (!onboarding) {
			throw new NotFoundException(`Onboarding not found for user ${userId}`);
		}
		return onboarding;
	}

	async updateStep(
		userId: string,
		step: number,
		stepData?: any,
	): Promise<Onboarding> {
		this.ensureUserIdProvided(userId);
		this.ensureStepIsValid(step);

		const onboarding = await this.findByUserId(userId);
		const updatedData = this.mergeStepData(
			onboarding?.data || {},
			step,
			stepData,
		);
		const isCompleted = this.checkCompletion(updatedData);

		const updateDto: UpdateOnboardingDto = {
			step,
			completed: isCompleted,
			data: updatedData,
		};

		const updatedOnboarding = await this.onboardingRepository.update(
			userId,
			updateDto,
		);
		if (!updatedOnboarding) {
			throw new NotFoundException(
				`Failed to update onboarding for user ${userId}`,
			);
		}

		return updatedOnboarding;
	}

	async assignPlanBasedOnOnboarding(
		userId: string,
	): Promise<{ client: any; plan: Plan }> {
		const onboarding = await this.findByUserId(userId);
		this.ensureOnboardingCompleted(onboarding);

		const client = await this.clientsService.findOne(userId);
		if (!client) {
			throw new NotFoundException(`Client not found for user ${userId}`);
		}

		// Update client userInfo with onboarding data
		const onboardingData = onboarding?.data || {};
		const userInfoFromOnboarding =
			this.extractUserInfoFromOnboarding(onboardingData);
		await this.clientsService.updateUserInfo(userId, userInfoFromOnboarding);

		// Set isOnboardingCompleted to true
		await this.clientsService.update(userId, { isOnboardingCompleted: true });

		// Create notification for first-time registration
		try {
			await this.notificationsService.create({
				clientId: userId,
				name: userInfoFromOnboarding.name || client.email || "Cliente sin nombre",
				reason: "Primera vez",
				phone: userInfoFromOnboarding.phone || "",
				status: NotificationStatus.PENDING,
			});
		} catch (notificationError) {
			// Log the error but don't fail the onboarding completion
			console.error("Error creating notification for new user:", notificationError);
		}

		const recommendedPlan = await this.planRecommendationService.recommendPlan(
			onboarding?.data || {},
		);
		this.ensurePlanIsValid(recommendedPlan);

		const updatedClient = await this.clientsService.assignPlanToClient(
			userId,
			recommendedPlan,
		);

		if (onboarding && !onboarding.completed) {
			await this.onboardingRepository.update(userId, { completed: true });
		}

		return { client: updatedClient, plan: recommendedPlan };
	}

	private extractUserInfoFromOnboarding(onboardingData: StepData): any {
		const userInfo: any = {};

		if (onboardingData.step1) {
			userInfo.name = onboardingData.step1.fullName;
			userInfo.address = onboardingData.step1.address;
			userInfo.phone = onboardingData.step1.phone;
			userInfo.medicalSociety = onboardingData.step1.mutual;
			userInfo.dateBirthday = new Date(onboardingData.step1.dateOfBirth);
			userInfo.sex = onboardingData.step1.sex;
			userInfo.CI = onboardingData.step1.ci;

			if (onboardingData.step1.avatarUrl) {
				userInfo.avatarUrl = onboardingData.step1.avatarUrl;
			}
		}

		if (onboardingData.step2) {
			userInfo.bloodPressure = onboardingData.step2.bloodPressure;
			userInfo.respiratoryHistory = onboardingData.step2.history.respiratory;
			userInfo.cardiacHistory = onboardingData.step2.history.cardiac;
			userInfo.surgicalHistory = onboardingData.step2.history.chirurgical;
			userInfo.historyofPathologicalLesions =
				onboardingData.step2.history.injuries;
		}

		return userInfo;
	}

	private ensureUserIdProvided(userId: string): void {
		if (!userId) {
			throw new BadRequestException("ID de usuario es requerido");
		}
	}

	private ensureStepIsValid(step: number): void {
		if (step < 1 || step > 3) {
			throw new BadRequestException("El paso debe estar entre 1 y 3");
		}
	}

	private mergeStepData(
		currentData: StepData,
		step: number,
		newStepData?: any,
	): StepData {
		if (!newStepData) return currentData;

		const stepKey = `step${step}`;
		return { ...currentData, [stepKey]: newStepData };
	}

	private checkCompletion(data: StepData): boolean {
		return Boolean(data.step1 && data.step2 && data.step3);
	}

	private ensureOnboardingCompleted(onboarding: Onboarding | null): void {
		if (!onboarding || !onboarding.completed || !onboarding.data?.step3) {
			throw new BadRequestException(
				"Onboarding must be completed to assign a plan",
			);
		}
	}

	private ensurePlanIsValid(plan: Plan): void {
		if (!plan || !plan._id) {
			throw new NotFoundException("No se encontró un plan adecuado");
		}
	}
}

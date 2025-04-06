import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { CreateOnboardingDto } from "./dto/create-onboarding.dto";
import { UpdateOnboardingDto } from "./dto/update-onboarding.dto";
import { OnboardingRepository } from "./repositories/onboarding.repository";
import { Onboarding, StepData } from "./schemas/onboarding.schema";

@Injectable()
export class OnboardingService {
	constructor(private readonly onboardingRepository: OnboardingRepository) {}

	async create(createOnboardingDto: CreateOnboardingDto): Promise<Onboarding> {
		const existingOnboarding = await this.onboardingRepository.findByUserId(
			createOnboardingDto.userId,
		);

		if (existingOnboarding) {
			throw new BadRequestException("Onboarding for this user already exists");
		}

		return this.onboardingRepository.create(createOnboardingDto);
	}

	async findAll(): Promise<Onboarding[]> {
		return this.onboardingRepository.findAll();
	}

	async findByUserId(userId: string): Promise<Onboarding> {
		if (!userId) {
			throw new BadRequestException("User ID is required");
		}

		const onboarding = await this.onboardingRepository.findByUserId(userId);

		if (!onboarding) {
			throw new NotFoundException(
				`Onboarding for user with ID ${userId} not found`,
			);
		}

		return onboarding;
	}

	async update(
		userId: string,
		updateOnboardingDto: UpdateOnboardingDto,
	): Promise<Onboarding> {
		if (!userId) {
			throw new BadRequestException("User ID is required");
		}

		const updatedOnboarding = await this.onboardingRepository.update(
			userId,
			updateOnboardingDto,
		);

		if (!updatedOnboarding) {
			throw new NotFoundException(
				`Onboarding for user with ID ${userId} not found`,
			);
		}

		return updatedOnboarding;
	}

	async remove(userId: string): Promise<Onboarding> {
		if (!userId) {
			throw new BadRequestException("User ID is required");
		}

		const deletedOnboarding = await this.onboardingRepository.remove(userId);

		if (!deletedOnboarding) {
			throw new NotFoundException(
				`Onboarding for user with ID ${userId} not found`,
			);
		}

		return deletedOnboarding;
	}

	async updateStep(
		userId: string,
		step: number,
		stepData?: any,
	): Promise<Onboarding> {
		if (!userId) {
			throw new BadRequestException("User ID is required");
		}

		if (step < 1 || step > 3) {
			throw new BadRequestException("Step must be between 1 and 3");
		}

		const onboarding = await this.findByUserId(userId);
		let updatedData: StepData = onboarding.data || {};

		// Update the appropriate step data
		if (stepData) {
			if (step === 1 && "fullName" in stepData) {
				updatedData = {
					...updatedData,
					step1: stepData,
				};
			} else if (step === 2 && "bloodPressure" in stepData) {
				updatedData = {
					...updatedData,
					step2: stepData,
				};
			} else if (step === 3 && "trainingDays" in stepData) {
				updatedData = {
					...updatedData,
					step3: stepData,
				};
			}
		}

		// Check if all steps are completed
		const isCompleted =
			step === 3 &&
			!!updatedData.step1 &&
			!!updatedData.step2 &&
			!!updatedData.step3;

		const updateData: UpdateOnboardingDto = {
			step,
			completed: isCompleted,
			data: updatedData,
		};

		const updatedOnboarding = await this.onboardingRepository.update(
			userId,
			updateData,
		);

		if (!updatedOnboarding) {
			throw new NotFoundException(
				`Failed to update onboarding for user with ID ${userId}`,
			);
		}

		return updatedOnboarding;
	}
}

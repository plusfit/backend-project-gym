import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	Patch,
	Post,
	Req,
} from "@nestjs/common";
import {
	ApiBody,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";

import { CreateOnboardingDto } from "./dto/create-onboarding.dto";
import {
	HealthInfoDto,
	PersonalInfoDto,
	TrainingPreferencesDto,
} from "./dto/create-onboarding.dto";
import { UpdateOnboardingDto } from "./dto/update-onboarding.dto";
import { OnboardingService } from "./onboarding.service";
import { Onboarding } from "./schemas/onboarding.schema";

@ApiTags("onboarding")
@Controller("onboarding")
export class OnboardingController {
	constructor(private readonly onboardingService: OnboardingService) {}

	@Post()
	@ApiOperation({ summary: "Create a new onboarding record" })
	@ApiCreatedResponse({
		description: "The onboarding record has been successfully created.",
		type: Onboarding,
		status: HttpStatus.CREATED,
	})
	create(
		@Body() createOnboardingDto: CreateOnboardingDto,
	): Promise<Onboarding> {
		return this.onboardingService.create(createOnboardingDto);
	}

	@Get()
	@ApiOperation({ summary: "Get all onboarding records" })
	@ApiOkResponse({
		description: "Returns all onboarding records",
		type: [Onboarding],
	})
	findAll(): Promise<Onboarding[]> {
		return this.onboardingService.findAll();
	}

	@Get(":userId")
	@ApiOperation({ summary: "Get onboarding by user ID" })
	@ApiParam({
		name: "userId",
		description: "User ID to find onboarding for",
		required: true,
	})
	@ApiOkResponse({
		description: "Returns the onboarding record for the specified user",
		type: Onboarding,
	})
	findOne(@Param("userId") userId: string): Promise<Onboarding | null> {
		return this.onboardingService.findByUserId(userId);
	}

	@Patch(":userId")
	@ApiOperation({ summary: "Update an onboarding record" })
	@ApiParam({
		name: "userId",
		description: "User ID to update onboarding for",
		required: true,
	})
	@ApiOkResponse({
		description: "The onboarding record has been successfully updated",
		type: Onboarding,
	})
	update(
		@Param("userId") userId: string,
		@Body() updateOnboardingDto: UpdateOnboardingDto,
	): Promise<Onboarding> {
		return this.onboardingService.update(userId, updateOnboardingDto);
	}

	@Patch(":userId/step/1")
	@ApiOperation({ summary: "Update step 1 - Personal Information" })
	@ApiParam({
		name: "userId",
		description: "User ID to update onboarding step for",
		required: true,
	})
	@ApiBody({
		description: "Personal information data",
		type: PersonalInfoDto,
	})
	@ApiOkResponse({
		description: "The onboarding step has been successfully updated",
		type: Onboarding,
	})
	updateStep1(
		@Param("userId") userId: string,
		@Body() personalInfo: PersonalInfoDto,
	): Promise<Onboarding> {
		return this.onboardingService.updateStep(userId, 1, personalInfo);
	}

	@Patch(":userId/step/2")
	@ApiOperation({ summary: "Update step 2 - Health Information" })
	@ApiParam({
		name: "userId",
		description: "User ID to update onboarding step for",
		required: true,
	})
	@ApiBody({
		description: "Health information data",
		type: HealthInfoDto,
	})
	@ApiOkResponse({
		description: "The onboarding step has been successfully updated",
		type: Onboarding,
	})
	updateStep2(
		@Param("userId") userId: string,
		@Body() healthInfo: HealthInfoDto,
	): Promise<Onboarding> {
		return this.onboardingService.updateStep(userId, 2, healthInfo);
	}

	@Patch(":userId/step/3")
	@ApiOperation({ summary: "Update step 3 - Training Preferences" })
	@ApiParam({
		name: "userId",
		description: "User ID to update onboarding step for",
		required: true,
	})
	@ApiBody({
		description: "Training preferences data",
		type: TrainingPreferencesDto,
	})
	@ApiOkResponse({
		description: "The onboarding step has been successfully updated",
		type: Onboarding,
	})
	updateStep3(
		@Param("userId") userId: string,
		@Body() trainingPreferences: TrainingPreferencesDto,
	): Promise<Onboarding> {
		return this.onboardingService.updateStep(userId, 3, trainingPreferences);
	}

	@Post(":userId/assign-plan")
	@ApiOperation({
		summary: "Assign a plan automatically based on onboarding data",
	})
	@ApiParam({
		name: "userId",
		description:
			"User ID to assign a plan for (debe ser un ID válido de MongoDB)",
		required: true,
	})
	@ApiOkResponse({
		description:
			"Returns the client with the assigned plan and the plan details",
		schema: {
			type: "object",
			properties: {
				client: {
					type: "object",
					description: "Updated client information",
				},
				plan: {
					type: "object",
					description: "Details of the assigned plan",
				},
			},
		},
	})
	assignPlan(@Param("userId") userId: string) {
		return this.onboardingService.assignPlanBasedOnOnboarding(userId);
	}

	@Post("me/assign-plan")
	@ApiOperation({
		summary: "Assign a plan automatically for the current authenticated user",
	})
	@ApiOkResponse({
		description:
			"Returns the client with the assigned plan and the plan details",
		schema: {
			type: "object",
			properties: {
				client: {
					type: "object",
					description: "Updated client information",
				},
				plan: {
					type: "object",
					description: "Details of the assigned plan",
				},
			},
		},
	})
	assignPlanForCurrentUser(@Req() req: any) {
		const user = (req as any).user;

		if (!user || (!user._id && !user.id)) {
			throw new BadRequestException(
				"No se pudo identificar al usuario autenticado",
			);
		}

		const userId = user._id || user.id;
		return this.onboardingService.assignPlanBasedOnOnboarding(userId);
	}

	@Delete(":userId")
	@ApiOperation({ summary: "Delete an onboarding record" })
	@ApiParam({
		name: "userId",
		description: "User ID to delete onboarding for",
		required: true,
	})
	@ApiOkResponse({
		description: "The onboarding record has been successfully deleted",
		type: Onboarding,
	})
	remove(@Param("userId") userId: string): Promise<Onboarding> {
		return this.onboardingService.remove(userId);
	}
}

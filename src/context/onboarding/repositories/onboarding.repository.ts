import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateOnboardingDto } from "../dto/create-onboarding.dto";
import { UpdateOnboardingDto } from "../dto/update-onboarding.dto";
import { Onboarding, OnboardingDocument } from "../schemas/onboarding.schema";

@Injectable()
export class OnboardingRepository {
	constructor(
		@InjectModel(Onboarding.name)
		private onboardingModel: Model<OnboardingDocument>,
	) {}

	async create(createOnboardingDto: CreateOnboardingDto): Promise<Onboarding> {
		const createdOnboarding = new this.onboardingModel(createOnboardingDto);
		return createdOnboarding.save();
	}

	async findAll(): Promise<Onboarding[]> {
		return this.onboardingModel.find().exec();
	}

	async findByUserId(userId: string): Promise<Onboarding | null> {
		return this.onboardingModel.findOne({ userId }).exec();
	}

	async update(
		userId: string,
		updateOnboardingDto: UpdateOnboardingDto,
	): Promise<Onboarding | null> {
		return this.onboardingModel
			.findOneAndUpdate({ userId }, updateOnboardingDto, { new: true })
			.exec();
	}

	async remove(userId: string): Promise<Onboarding | null> {
		return this.onboardingModel.findOneAndDelete({ userId }).exec();
	}
}

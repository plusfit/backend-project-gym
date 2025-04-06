import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type OnboardingDocument = HydratedDocument<Onboarding>;

// Step 1: Personal Information
export interface PersonalInfo {
	fullName: string;
	address: string;
	phone: string;
	mutual: string;
	dateOfBirth: string;
	sex: string;
	ci: string;
}

// Step 2: Health Information
export interface HealthHistory {
	respiratory: string;
	cardiac: string;
	chirurgical: string;
	injuries: string;
}

export interface HealthInfo {
	bloodPressure: string;
	history: HealthHistory;
}

// Step 3: Training Preferences
export interface TrainingPreferences {
	trainingDays: number;
	goal: string;
	trainingType: string;
	trainingLevel: string;
}

export interface StepData {
	step1?: PersonalInfo;
	step2?: HealthInfo;
	step3?: TrainingPreferences;
}

@Schema({ timestamps: true })
export class Onboarding {
	@Prop({ required: true })
	userId!: string;

	@Prop({ required: true })
	step!: number;

	@Prop({ required: true, default: false })
	completed!: boolean;

	@Prop({ type: Object })
	data?: StepData;
}

export const OnboardingSchema = SchemaFactory.createForClass(Onboarding);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class UserInfo extends Document {
	@Prop()
	name?: string;

	@Prop()
	password?: string;

	@Prop()
	identifier?: string;

	@Prop({ type: Date })
	dateBirthday?: Date;

	@Prop()
	sex?: string;

	@Prop()
	phone?: string;

	@Prop()
	plan?: string;

	@Prop()
	address?: string;

	@Prop()
	historyofPathologicalLesions?: string;

	@Prop()
	medicalSociety?: string;

	@Prop()
	cardiacHistory?: string;

	@Prop()
	bloodPressure?: string;

	@Prop()
	frequencyOfPhysicalExercise?: string;

	@Prop()
	respiratoryHistory?: string;

	@Prop()
	surgicalHistory?: string;

	@Prop()
	CI?: string;

	@Prop()
	avatarUrl?: string;
}

@Schema()
export class Client extends Document {
	@Prop({ default: "User" })
	role!: string;

	@Prop()
	planId!: string;

	@Prop()
	routineId?: string;

	@Prop({ required: true, unique: true })
	email!: string;

	@Prop({ type: SchemaFactory.createForClass(UserInfo) })
	userInfo?: UserInfo;

	@Prop()
	refreshToken?: string;

	@Prop({ default: false })
	isOnboardingCompleted?: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
export type ClientDocument = Client & Document;

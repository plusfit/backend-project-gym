import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class UserInfo extends Document {
	@Prop({ type: String })
	name?: string;

	@Prop({ type: String })
	password?: string;

	@Prop({ type: String })
	identifier?: string;

	@Prop({ type: Date })
	dateBirthday?: Date;

	@Prop({ type: String })
	sex?: string;

	@Prop({ type: String })
	phone?: string;

	@Prop({ type: String })
	plan?: string;

	@Prop({ type: String })
	address?: string;

	@Prop({ type: String })
	historyofPathologicalLesions?: string;

	@Prop({ type: String })
	medicalSociety?: string;

	@Prop({ type: String })
	cardiacHistory?: string;

	@Prop({ type: String })
	bloodPressure?: string;

	@Prop({ type: String })
	respiratoryHistory?: string;

	@Prop({ type: String })
	surgicalHistory?: string;

	@Prop({ type: String })
	CI?: string;

	@Prop({ type: String })
	avatarUrl?: string;
}

@Schema({ timestamps: true })
export class Client extends Document {
	@Prop({ default: "User", type: String })
	role!: string;

	@Prop({ type: String })
	planId!: string;

	@Prop({ type: String })
	routineId?: string;

	@Prop({ required: true, unique: true, type: String })
	email!: string;

	@Prop({ type: SchemaFactory.createForClass(UserInfo) })
	userInfo?: UserInfo;

	@Prop({ type: String })
	refreshToken?: string;

	@Prop({ default: false, type: Boolean })
	isOnboardingCompleted?: boolean;

	@Prop({ default: false, type: Boolean })
	disabled?: boolean;

	@Prop({ type: Date })
	lastAccess?: Date; // Last successful access date

	@Prop({ type: Number, default: 0 })
	totalAccesses?: number; // Total successful accesses

	@Prop({ type: Number, default: 0 })
	consecutiveDays?: number; // Current consecutive days streak

	@Prop({ type: Number, default: 0 })
	availablePoints?: number; // Points available for prize redemption
	availableDays?: number; // Days available for gym access (decremented daily)
}

export const ClientSchema = SchemaFactory.createForClass(Client);
export type ClientDocument = Client & Document;

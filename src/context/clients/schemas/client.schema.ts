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

/**
 * One browser or device that accepted push notifications.
 *
 * A person can carry several, and a device can change hands, so the token is
 * what identifies the entry rather than the client.
 */
@Schema({ _id: false })
export class PushToken {
	@Prop({ required: true, type: String })
	token!: string;

	@Prop({ type: String })
	userAgent?: string;

	@Prop({ type: Date, default: Date.now })
	createdAt?: Date;

	@Prop({ type: Date, default: Date.now })
	lastSeenAt?: Date;
}

export const PushTokenSchema = SchemaFactory.createForClass(PushToken);

@Schema({ timestamps: true })
export class Client extends Document {
	@Prop({ default: "User", type: String })
	role!: string;

	@Prop({ type: String })
	planId?: string;

	@Prop({ type: String })
	routineId?: string;

	@Prop({ required: true, unique: true, type: String })
	email!: string;

	@Prop({ type: SchemaFactory.createForClass(UserInfo) })
	userInfo?: UserInfo;

	@Prop({ type: String })
	refreshToken?: string;

	@Prop({ type: String, select: false })
	password?: string;

	@Prop({ type: String, select: false })
	plainPassword?: string;

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
	weeklyAttendance?: number; // Total days attended per week (reset weekly)

	@Prop({ type: Number, default: 0 })
	availablePoints?: number; // Points available for prize redemption

	@Prop({ type: Number, default: 0 })
	availableDays?: number; // Days available for gym access (decremented daily)

	@Prop({ type: [PushTokenSchema], default: [] })
	pushTokens?: PushToken[];

	/**
	 * Opt-outs by reminder rule key. A rule absent from this map is enabled, so
	 * adding a new rule needs no migration.
	 */
	@Prop({ type: Object, default: {} })
	notificationPreferences?: Record<string, boolean>;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
export type ClientDocument = Client & Document;

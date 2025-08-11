import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class GymAccess extends Document {
	@Prop({ type: Types.ObjectId, ref: "Client", required: true })
	clientId!: Types.ObjectId;

	@Prop({ type: String, required: true })
	cedula!: string;

	@Prop({ type: Date, required: true, default: Date.now })
	accessDate!: Date;

	@Prop({ type: String, required: true })
	accessDay!: string; // "YYYY-MM-DD" format for same-day validation

	@Prop({ type: String })
	scheduleStartTime?: string; // Schedule start time (e.g., "19" for 7 PM)

	@Prop({ type: String })
	scheduleEndTime?: string; // Schedule end time (e.g., "20" for 8 PM)

	@Prop({ type: Types.ObjectId, ref: "Schedule" })
	scheduleId?: Types.ObjectId; // Reference to the specific schedule

	@Prop({ type: Boolean, required: true, default: true })
	successful!: boolean;

	@Prop({ type: String })
	reason?: string; // Reason for denial (if applicable)

	@Prop({ type: String, required: true })
	clientName!: string; // Denormalized for quick access

	@Prop({ type: String })
	clientPhoto?: string; // Denormalized for quick access
}

export const GymAccessSchema = SchemaFactory.createForClass(GymAccess);
export type GymAccessDocument = GymAccess & Document;
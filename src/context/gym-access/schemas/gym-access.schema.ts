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
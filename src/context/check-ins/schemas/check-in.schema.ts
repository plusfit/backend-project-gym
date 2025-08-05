import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class CheckIn extends Document {
	@Prop({ required: true, type: Types.ObjectId, ref: "Client" })
	clientId!: Types.ObjectId;

	@Prop({ required: true, type: Date, default: Date.now })
	checkInDate!: Date;

	@Prop({ type: String })
	organizationId?: string;

	@Prop({ type: String })
	notes?: string;
}

export const CheckInSchema = SchemaFactory.createForClass(CheckIn);
export type CheckInDocument = CheckIn & Document;

// Índices para optimizar consultas
CheckInSchema.index({ clientId: 1, checkInDate: -1 });
CheckInSchema.index({ checkInDate: -1 });
CheckInSchema.index({ organizationId: 1 });
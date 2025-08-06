import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CheckIn extends Document {
	@Prop({ required: true, type: String, length: 9 })
	ci!: string;

	@Prop({ required: true, type: Date, default: Date.now })
	checkInDate!: Date;

	@Prop({ type: String })
	notes?: string;
}

export const CheckInSchema = SchemaFactory.createForClass(CheckIn);
export type CheckInDocument = CheckIn & Document;

// Índices para optimizar consultas
CheckInSchema.index({ ci: 1, checkInDate: -1 });
CheckInSchema.index({ checkInDate: -1 });
CheckInSchema.index({ ci: 1 });
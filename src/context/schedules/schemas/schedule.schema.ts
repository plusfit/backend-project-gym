import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Schedule extends Document {
	@Prop({ type: String, required: true })
	startTime!: string;

	@Prop({ type: String, required: true })
	endTime!: string;

	@Prop({ type: Number, required: true })
	maxCount!: number;

	@Prop({ type: [{ type: Types.ObjectId, ref: "Client" }], required: true })
	clients!: Types.ObjectId[];

	@Prop({ type: String, required: true })
	day!: string;

	@Prop({ type: Boolean, default: false })
	disabled!: boolean;

	@Prop({ type: String, required: false })
	disabledReason?: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

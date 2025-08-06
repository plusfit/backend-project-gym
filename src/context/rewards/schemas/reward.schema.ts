import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Reward extends Document {
	@Prop({ type: String, required: true })
	name!: string;

	@Prop({ type: String, required: true })
	description!: string;

	@Prop({ type: Number, required: true, min: 1 })
	requiredDays!: number; // Days needed to earn this reward

	@Prop({ type: Boolean, required: true, default: true })
	isActive!: boolean; // Whether reward is currently active
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
export type RewardDocument = Reward & Document;
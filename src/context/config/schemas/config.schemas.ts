import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class HourClass {
	@Prop({ required: true, type: String })
	day!: string;

	@Prop({ required: true, type: [Number] })
	hours!: number[];

	@Prop({ required: true, type: Number })
	maxCount!: number;
}

export const HourClassSchema = SchemaFactory.createForClass(HourClass);

@Schema()
export class Config extends Document {
	@Prop({ required: true, type: [HourClassSchema] })
	schedule!: HourClass[];
}

export const ConfigSchema = SchemaFactory.createForClass(Config);

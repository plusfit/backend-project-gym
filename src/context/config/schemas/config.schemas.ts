import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
class HourClass {
	@Prop({ required: true })
	day!: string;

	@Prop({ required: true, type: [Number] })
	hours!: number[];

	@Prop({ required: true })
	maxCount!: number;
}

@Schema()
export class Config extends Document {
	@Prop({ required: true, type: [HourClass] })
	schedule!: HourClass[];
}

export const ConfigSchema = SchemaFactory.createForClass(Config);

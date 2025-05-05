import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongo, Types } from "mongoose";

@Schema()
export class SubRoutine extends Document {
	@Prop({ required: true, unique: true })
	name!: string;

	@Prop({ required: true })
	description!: string;

	@Prop({ type: [{ type: SchemaMongo.Types.ObjectId, ref: "Exercise" }] })
	exercises!: Types.ObjectId[];

	@Prop({ default: Date.now() })
	updatedAt!: Date;

	@Prop({ default: Date.now() })
	createdAt!: Date;

	@Prop({ required: true })
	category!: string;
}

export const SubRoutineSchema = SchemaFactory.createForClass(SubRoutine);
export type SubRoutineDocument = SubRoutine & Document;

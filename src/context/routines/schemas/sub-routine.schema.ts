import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class SubRoutine extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Exercise" }] })
  exercises!: Types.ObjectId[];

  @Prop({ required: true })
  day!: string;
}

export const SubRoutineSchema = SchemaFactory.createForClass(SubRoutine);
export type SubRoutineDocument = SubRoutine & Document;

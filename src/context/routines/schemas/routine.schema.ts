import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

import { Exercise } from "@/src/context/exercises/schemas/exercise.schema";

@Schema()
export class Routine extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Exercise" }] })
  exercises!: Types.ObjectId[];
}

export const RoutineSchema = SchemaFactory.createForClass(Routine);
export type RoutineDocument = Exercise & Document;

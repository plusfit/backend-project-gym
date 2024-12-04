import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongo, Types } from "mongoose";

@Schema()
export class SubRoutine extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ type: [{ type: SchemaMongo.Types.ObjectId, ref: "Exercise" }] })
  exercises!: Types.ObjectId[];
}

export const SubRoutineSchema = SchemaFactory.createForClass(SubRoutine);
export type SubRoutineDocument = SubRoutine & Document;

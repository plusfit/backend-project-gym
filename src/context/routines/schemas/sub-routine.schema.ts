import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongo, Types } from "mongoose";

import { EDay } from "@/src/context/shared/enums/days.enum";

@Schema()
export class SubRoutine extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ type: [{ type: SchemaMongo.Types.ObjectId, ref: "Exercise" }] })
  exercises!: Types.ObjectId[];

  @Prop({ required: true, type: Number, enum: EDay })
  day!: EDay;
}

export const SubRoutineSchema = SchemaFactory.createForClass(SubRoutine);
export type SubRoutineDocument = SubRoutine & Document;

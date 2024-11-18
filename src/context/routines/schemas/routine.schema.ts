import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { SubRoutine } from "@/src/context/routines/entities/subroutine.entity";

@Schema()
export class Routine extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: () => SubRoutine }] })
  subRoutines!: Types.ObjectId[];

  @Prop({ required: true })
  days!: string[];
}

export const RoutineSchema = SchemaFactory.createForClass(Routine);
export type RoutineDocument = Routine & Document;

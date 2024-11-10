import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

import { Routine } from "@/src/context/routines/schemas/routine.schema";

@Schema()
export class Plan extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: { type: Types.ObjectId, ref: () => Routine } })
  defaultRoutine!: Routine;

  @Prop({ default: Date.now() })
  updatedAt!: Date;

  @Prop({ default: Date.now() })
  createdAt!: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
export type PlanDocument = Plan & Document;

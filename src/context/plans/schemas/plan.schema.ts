import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

import {
  InjuryType,
  PlanGoal,
  SexType,
  Tags,
} from "@/src/context/shared/enums/plan.enum";

@Schema()
export class Plan extends Document {
  @Prop({ required: true, type: String })
  name!: string;

  @Prop({ required: true, type: String })
  type!: string;

  @Prop({ required: true, type: String, enum: Object.values(PlanGoal) })
  goal!: string;

  @Prop({ required: true, type: String, enum: Object.values(SexType) })
  sexType!: string;

  @Prop({ required: false, type: String, enum: Object.values(InjuryType), default: null })
  injuryType?: string;

  @Prop({ required: false, type: Number })
  minAge?: number;

  @Prop({ required: false, type: Number })
  maxAge?: number;

  @Prop({ default: false, type: Boolean })
  includesCoach!: boolean;

  @Prop({ type: [String], enum: Object.values(Tags), default: [] })
  tags!: string[];

  @Prop({ type: Types.ObjectId, ref: "Routine", required: true })
  defaultRoutine!: Types.ObjectId;

  @Prop({ required: true, type: Number })
  days!: number;

  @Prop({ default: Date.now, type: Date })
  updatedAt!: Date;

  @Prop({ default: Date.now, type: Date })
  createdAt!: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
export type PlanDocument = Plan & Document;

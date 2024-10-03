import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

import { Routine } from "../dto/create-plan.dto";

@Schema()
export class Plan extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  routines!: Routine[];

  @Prop({ required: true })
  daysCount!: number;

  @Prop({ required: true })
  days!: string[];

  @Prop({ default: Date.now() })
  updatedAt!: Date;

  @Prop({ default: Date.now() })
  createdAt!: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
export type PlanDocument = Plan & Document;

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Plan extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ type: Types.ObjectId, ref: "Routine", required: true })
  defaultRoutine!: Types.ObjectId;

  @Prop({ required: true })
  days!: number;

  @Prop({ default: Date.now() })
  updatedAt!: Date;

  @Prop({ default: Date.now() })
  createdAt!: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
export type PlanDocument = Plan & Document;

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Schedule extends Document {
  @Prop({ type: Date, required: true })
  startTime!: Date;

  @Prop({ type: Date, required: true })
  endTime!: Date;

  @Prop({ type: Number, required: true })
  maxCount!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Client" }], required: true })
  clients!: Types.ObjectId[];

  @Prop({ type: String, required: true })
  day!: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

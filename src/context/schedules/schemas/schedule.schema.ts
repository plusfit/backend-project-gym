import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { TenantBaseEntity } from "@/src/context/shared/entities/tenant-base.entity";

@Schema({ timestamps: true })
export class Schedule extends TenantBaseEntity {
  @Prop({ type: String, required: true })
  startTime!: string;

  @Prop({ type: String, required: true })
  endTime!: string;

  @Prop({ type: Number, required: true })
  maxCount!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Client" }], required: true })
  clients!: Types.ObjectId[];

  @Prop({ type: String, required: true })
  day!: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
ScheduleSchema.index(
  { organizationId: 1, day: 1, startTime: 1, endTime: 1 },
  { unique: true },
);
export type ScheduleDocument = Schedule & Document;

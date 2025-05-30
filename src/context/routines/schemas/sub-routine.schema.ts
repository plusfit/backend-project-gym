import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongo, Types } from "mongoose";
import { TenantBaseEntity } from "@/src/context/shared/entities/tenant-base.entity";

@Schema({ timestamps: true })
export class SubRoutine extends TenantBaseEntity {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [{ type: SchemaMongo.Types.ObjectId, ref: "Exercise" }] })
  exercises!: Types.ObjectId[];

  @Prop({ required: true })
  category!: string;
}

export const SubRoutineSchema = SchemaFactory.createForClass(SubRoutine);
SubRoutineSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export type SubRoutineDocument = SubRoutine & Document;

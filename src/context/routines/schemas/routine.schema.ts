import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongo, Types } from "mongoose";
import { TenantBaseEntity } from "@/src/context/shared/entities/tenant-base.entity";

@Schema({ timestamps: true })
export class Routine extends TenantBaseEntity {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ required: true, default: false })
  isGeneral!: boolean;

  @Prop({ required: false })
  type!: string;

  @Prop({ type: [{ type: SchemaMongo.Types.ObjectId, ref: "SubRoutine" }] })
  subRoutines!: Types.ObjectId[];
}

export const RoutineSchema = SchemaFactory.createForClass(Routine);
RoutineSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export type RoutineDocument = Routine & Document;

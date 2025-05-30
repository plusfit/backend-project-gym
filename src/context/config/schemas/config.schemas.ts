import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { TenantBaseEntity } from "@/src/context/shared/entities/tenant-base.entity";

@Schema()
class HourClass {
  @Prop({ required: true })
  day!: string;

  @Prop({ required: true, type: [Number] })
  hours!: number[];

  @Prop({ required: true })
  maxCount!: number;
}

@Schema({ timestamps: true })
export class Config extends TenantBaseEntity {
  @Prop({ required: true, type: [HourClass] })
  schedule!: HourClass[];
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
export type ConfigDocument = Config & Document;

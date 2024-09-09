import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

import { Hour } from "../intefaces/hour.interface";

@Schema()
export class Config extends Document {
  @Prop({ required: true })
  schedule!: Hour[];
}

export const ConfigSchema = SchemaFactory.createForClass(Config);

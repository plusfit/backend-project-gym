import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongo, Types } from "mongoose";

@Schema()
export class Routine extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  // @Prop({ required: true })
  // category!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ required: true, default: false })
  isGeneral!: boolean;

  @Prop({ required: true })
  type!: string;

  @Prop({ type: [{ type: SchemaMongo.Types.ObjectId, ref: "SubRoutine" }] })
  subRoutines!: Types.ObjectId[];
}

export const RoutineSchema = SchemaFactory.createForClass(Routine);
export type RoutineDocument = Routine & Document;

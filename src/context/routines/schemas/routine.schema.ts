import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
class SubRoutineDetail {
  @Prop({ required: true })
  day!: string;

  @Prop({ type: Types.ObjectId, ref: "SubRoutine", required: true })
  subRoutine!: Types.ObjectId;
}

const SubRoutineDetailSchema = SchemaFactory.createForClass(SubRoutineDetail);

@Schema()
export class Routine extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true, default: false })
  isCustom!: boolean;

  @Prop({ type: [SubRoutineDetailSchema], required: true })
  subRoutines!: SubRoutineDetail[];
}

export const RoutineSchema = SchemaFactory.createForClass(Routine);
export type RoutineDocument = Routine & Document;

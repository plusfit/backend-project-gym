import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class UserInfo extends Document {
  @Prop()
  name?: string;

  @Prop()
  date?: number;

  @Prop()
  sex?: string;

  @Prop()
  address?: string;

  @Prop()
  medicalSociety?: string;

  @Prop()
  cardiacHistory?: string;

  @Prop()
  cardiacHistoryInput?: string;

  @Prop()
  bloodPressure?: string;

  @Prop()
  frequencyOfPhysicalExercise?: string;

  @Prop()
  respiratoryHistory?: string;

  @Prop()
  respiratoryHistoryInput?: string;
}

@Schema()
export class Client extends Document {
  @Prop({ default: "User" })
  role!: string;

  @Prop()
  planId!: string;

  @Prop()
  routineId?: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ type: SchemaFactory.createForClass(UserInfo) })
  userInfo?: UserInfo;

  @Prop()
  refreshToken?: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
export type ClientDocument = Client & Document;

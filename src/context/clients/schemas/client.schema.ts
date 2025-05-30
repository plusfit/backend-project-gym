import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { TenantBaseEntity } from "@/src/context/shared/entities/tenant-base.entity";

@Schema()
export class UserInfo extends Document {
  @Prop()
  name?: string;

  @Prop()
  password?: string;

  @Prop()
  identifier?: string;

  @Prop({ type: Date })
  dateBirthday?: Date;

  @Prop()
  sex?: string;

  @Prop()
  phone?: string;

  @Prop()
  plan?: string;

  @Prop()
  address?: string;

  @Prop()
  historyofPathologicalLesions?: string;

  @Prop()
  medicalSociety?: string;

  @Prop()
  cardiacHistory?: string;

  @Prop()
  bloodPressure?: string;

  @Prop()
  frequencyOfPhysicalExercise?: string;

  @Prop()
  respiratoryHistory?: string;

  @Prop()
  surgicalHistory?: string;

  @Prop()
  CI?: string;

  @Prop()
  avatarUrl?: string;
}

@Schema({ timestamps: true })
export class Client extends TenantBaseEntity {
  @Prop({ default: "User" })
  role!: string;

  @Prop({ type: Types.ObjectId, ref: "Plan" })
  planId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Routine" })
  routineId?: Types.ObjectId;

  @Prop({ required: true })
  email!: string;

  @Prop({ type: SchemaFactory.createForClass(UserInfo) })
  userInfo?: UserInfo;

  @Prop()
  refreshToken?: string;

  @Prop({ default: false })
  isOnboardingCompleted?: boolean;

  @Prop({ default: false })
  disabled?: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
ClientSchema.index({ organizationId: 1, email: 1 }, { unique: true });
export type ClientDocument = Client & Document;

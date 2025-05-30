import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Organization extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop()
  description?: string;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  subscriptionPlan?: string;

  @Prop({ type: Date })
  subscriptionExpiresAt?: Date;

  @Prop({
    type: {
      maxClients: { type: Number, default: 100 },
      maxAdmins: { type: Number, default: 5 },
      features: [String],
    },
  })
  limits?: {
    maxClients: number;
    maxAdmins: number;
    features: string[];
  };
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
export type OrganizationDocument = Organization & Document;

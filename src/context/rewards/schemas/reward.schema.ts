import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'rewards', timestamps: true })
export class Reward {
  @Prop({ type: String, required: true, maxlength: 100, trim: true })
  name!: string;

  @Prop({ type: String, maxlength: 500, trim: true })
  description?: string;

  @Prop({ type: Number, required: true, min: 1 })
  pointsRequired!: number;

  @Prop({ type: Boolean, default: false })
  enabled!: boolean;

  @Prop({ type: Number, default: 0 })
  totalExchanges!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
export type RewardDocument = Reward & Document;

// Indexes
RewardSchema.index({ name: 'text' });
RewardSchema.index({ enabled: 1 });
RewardSchema.index({ createdAt: -1 });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: 'exchanges', timestamps: true })
export class Exchange {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Reward', required: true })
  rewardId!: string;

  @Prop({ type: String, required: true })
  rewardName!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client', required: true })
  clientId!: string;

  @Prop({ type: String, required: true })
  clientName!: string;

  @Prop({ type: String, required: true })
  clientEmail!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin', required: false })
  adminId?: string;

  @Prop({ type: String, required: false })
  adminName?: string;

  @Prop({ type: Number, required: true })
  pointsUsed!: number;

  @Prop({ type: Date, default: Date.now })
  exchangeDate!: Date;

  @Prop({ 
    type: String, 
    enum: ['completed', 'pending', 'cancelled'], 
    default: 'completed' 
  })
  status!: 'completed' | 'pending' | 'cancelled';

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExchangeSchema = SchemaFactory.createForClass(Exchange);
export type ExchangeDocument = Exchange & Document;

// Indexes
ExchangeSchema.index({ exchangeDate: -1 });
ExchangeSchema.index({ clientId: 1 });
ExchangeSchema.index({ rewardId: 1 });
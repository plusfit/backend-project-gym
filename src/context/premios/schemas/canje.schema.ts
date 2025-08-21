import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Canje {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Premio', required: true })
  premioId!: string;

  @Prop({ type: String, required: true })
  premioName!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client', required: true })
  clienteId!: string;

  @Prop({ type: String, required: true })
  clienteName!: string;

  @Prop({ type: String, required: true })
  clienteEmail!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin', required: false })
  adminId?: string;

  @Prop({ type: String, required: false })
  adminName?: string;

  @Prop({ type: Number, required: true })
  pointsUsed!: number;

  @Prop({ type: Date, default: Date.now })
  canjeDate!: Date;

  @Prop({ 
    type: String, 
    enum: ['completed', 'pending', 'cancelled'], 
    default: 'completed' 
  })
  status!: 'completed' | 'pending' | 'cancelled';

  createdAt?: Date;
  updatedAt?: Date;
}

export const CanjeSchema = SchemaFactory.createForClass(Canje);
export type CanjeDocument = Canje & Document;

// Índices
CanjeSchema.index({ canjeDate: -1 });
CanjeSchema.index({ clienteId: 1 });
CanjeSchema.index({ premioId: 1 });
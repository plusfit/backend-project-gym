import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Premio {
  @Prop({ type: String, required: true, maxlength: 100, trim: true })
  name!: string;

  @Prop({ type: String, maxlength: 500, trim: true })
  description?: string;

  @Prop({ type: Number, required: true, min: 1 })
  pointsRequired!: number;

  @Prop({ type: Boolean, default: false })
  enabled!: boolean;

  @Prop({ type: Number, default: 0 })
  totalCanjes!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PremioSchema = SchemaFactory.createForClass(Premio);
export type PremioDocument = Premio & Document;

// Índices
PremioSchema.index({ name: 'text' });
PremioSchema.index({ enabled: 1 });
PremioSchema.index({ createdAt: -1 });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Payment {
    @Prop({ required: true, type: Number })
    amount!: number;

    @Prop({ required: true, type: String })
    clientId!: string;

    @Prop({ required: true, type: String })
    clientName!: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
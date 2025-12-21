import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export enum NotificationStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
}

export enum NotificationReason {
    FIRST_TIME = "Primera vez",
    INACTIVITY = "Inactividad",
}

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Client", required: true })
    clientId?: MongooseSchema.Types.ObjectId;

    @Prop({ type: String, required: true })
    name?: string;

    @Prop({
        type: String,
        enum: NotificationReason,
        required: true,
    })
    reason?: NotificationReason;

    @Prop({ type: String, required: false })
    phone?: string;

    @Prop({
        type: String,
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
    })
    status?: NotificationStatus;

    createdAt?: Date;
    updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class InvitationCode extends Document {
	@Prop({ required: true, unique: true, type: String })
	code!: string;

	@Prop({ default: false, type: Boolean })
	isUsed!: boolean;

	@Prop({ type: String })
	usedBy?: string; // Client ID

	@Prop({ type: Date })
	usedAt?: Date;
}

export const InvitationCodeSchema = SchemaFactory.createForClass(InvitationCode);

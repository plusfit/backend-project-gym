import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum ReminderDispatchStatus {
	PENDING = "pending",
	SENT = "sent",
}

/**
 * Proof that one client was already told one thing on one day.
 *
 * The cron runs every 15 minutes so a failed pass can recover, which means the
 * same client is evaluated many times a day. The unique index below is what
 * stops that from turning into repeated notifications: the record is written
 * BEFORE the send and removed if the send never happened.
 */
@Schema({ timestamps: true })
export class ReminderDispatch extends Document {
	@Prop({ type: String, required: true })
	clientId!: string;

	@Prop({ type: String, required: true })
	ruleKey!: string;

	/** Local day in YYYY-MM-DD, so "once a day" means the gym's day. */
	@Prop({ type: String, required: true })
	dateKey!: string;

	@Prop({
		type: String,
		enum: ReminderDispatchStatus,
		default: ReminderDispatchStatus.PENDING,
	})
	status!: ReminderDispatchStatus;

	/** Batch returned by the notifications service, used to prune dead tokens. */
	@Prop({ type: String })
	batchId?: string;

	/** When this batch's failures were read, so it is not re-read forever. */
	@Prop({ type: Date })
	failuresCheckedAt?: Date;
}

export const ReminderDispatchSchema = SchemaFactory.createForClass(ReminderDispatch);
export type ReminderDispatchDocument = ReminderDispatch & Document;

// The whole idempotency guarantee rests on this index.
ReminderDispatchSchema.index(
	{ clientId: 1, ruleKey: 1, dateKey: 1 },
	{ unique: true },
);
ReminderDispatchSchema.index({ status: 1, createdAt: 1 });

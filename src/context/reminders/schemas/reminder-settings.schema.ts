import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

import { RuleSettings } from "@/src/context/reminders/rules/reminder-rule";

/** The single document is addressed by this constant. */
export const REMINDER_SETTINGS_SCOPE = "default";

/**
 * Gym-wide reminder configuration: one document, one entry per rule.
 *
 * Rules are stored as a map rather than fixed fields so a new rule needs no
 * migration. Anything missing falls back to the rule's own defaults, which ship
 * disabled, so a deploy never starts sending on its own.
 */
@Schema({ timestamps: true })
export class ReminderSettings extends Document {
	@Prop({ type: String, default: REMINDER_SETTINGS_SCOPE, unique: true })
	scope!: string;

	@Prop({ type: Object, default: {} })
	rules!: Record<string, RuleSettings>;
}

export const ReminderSettingsSchema = SchemaFactory.createForClass(ReminderSettings);
export type ReminderSettingsDocument = ReminderSettings & Document;

/**
 * One push notification, already addressed and rendered.
 *
 * The notifications service never resolves people or copy: it receives a device
 * token and the exact words to deliver, exactly as it receives a phone number
 * and a finished WhatsApp message.
 */
export interface PushRecipient {
	/** Device token issued by the push provider. */
	to: string;
	/** Heading shown on the notification. */
	title: string;
	/** Body text. */
	message: string;
	/** Extra data carried to the device; `url` becomes the deep link. */
	data?: Record<string, string>;
}

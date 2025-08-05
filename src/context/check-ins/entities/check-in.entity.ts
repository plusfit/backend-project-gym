import { Types } from "mongoose";

export class CheckIn {
	id!: string;
	clientId!: Types.ObjectId;
	checkInDate!: Date;
	organizationId?: string;
	notes?: string;
	createdAt!: Date;
	updatedAt!: Date;
}
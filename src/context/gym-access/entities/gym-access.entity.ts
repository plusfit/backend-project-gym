export class GymAccess {
	id!: string;
	clientId!: string;
	cedula!: string;
	accessDate!: Date;
	accessDay!: string;
	successful!: boolean;
	reason?: string;
	clientName!: string;
	clientPhoto?: string;
	createdAt!: Date;
	updatedAt!: Date;
}

export class AccessValidationResponse {
	success!: boolean;
	message!: string;
	client?: {
		name: string;
		photo?: string;
		plan?: string;
		consecutiveDays: number;
		totalAccesses: number;
	};
	reward?: {
		name: string;
		description: string;
		requiredDays: number;
	};
	reason?: string;
}

export class AccessStats {
	totalAccessesToday!: number;
	totalAccessesThisMonth!: number;
	averageAccessesPerDay!: number;
	mostActiveClients!: {
		clientName: string;
		cedula: string;
		totalAccesses: number;
	}[];
}
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
	message?: string;
	authorize!: boolean;
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
}

export class AccessStats {
	totalAccessesToday!: number;
	totalAccessesThisMonth!: number;
	averageAccessesPerDay!: number;
	totalAccesses!: number;
	successfulAccesses!: number;
	failedAccesses!: number;
	mostActiveClients!: {
		clientName: string;
		cedula: string;
		totalAccesses: number;
	}[];
}
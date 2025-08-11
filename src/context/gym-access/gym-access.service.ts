import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { ClientsService } from "@/src/context/clients/clients.service";
import { SchedulesService } from "@/src/context/schedules/schedules.service";
import { RewardsService } from "@/src/context/rewards/rewards.service";
import { ClientDocument } from "@/src/context/clients/schemas/client.schema";

import { GymAccessRepository, GymAccessFilters } from "./repositories/gym-access.repository";
import { AccessValidationResponse, GymAccess, AccessStats } from "./entities/gym-access.entity";
import { ValidateAccessDto } from "./dto/validate-access.dto";
import { GetGymAccessHistoryDto } from "./dto/get-gym-access-history.dto";

@Injectable()
export class GymAccessService {
	constructor(
		private readonly gymAccessRepository: GymAccessRepository,
		private readonly clientsService: ClientsService,
		private readonly schedulesService: SchedulesService,
		private readonly rewardsService: RewardsService,
		@InjectModel("Client")
		private readonly clientModel: Model<ClientDocument>,
	) {}

	async validateAccess(validateAccessDto: ValidateAccessDto): Promise<AccessValidationResponse> {
		const { cedula } = validateAccessDto;

		try {
			// 1. Find client by cedula
			const client = await this.findClientByCedula(cedula);
			if (!client) {
				const today = new Date();
				const accessDay = this.formatDateAsAccessDay(today);
				return this.createDenialResponseWithRecord("Cliente no encontrado en el sistema", null, cedula, today, accessDay, false);
			}

			if (client.disabled) {
				const today = new Date();
				const accessDay = this.formatDateAsAccessDay(today);
				return this.createDenialResponseWithRecord("Cliente deshabilitado", client, cedula, today, accessDay, false);
			}

			// 2. Check if already accessed today
			const today = new Date();
			const accessDay = this.formatDateAsAccessDay(today);
			
			console.log('=== DEBUG ACCESS VALIDATION ===');
			console.log('Cliente:', client.userInfo?.name || 'Sin nombre');
			console.log('Cedula:', cedula);
			console.log('Today:', today.toISOString());
			console.log('Access Day:', accessDay);
			
			const existingAccess = await this.gymAccessRepository.findByCedulaAndDay(cedula, accessDay);
			console.log('Existing access found:', existingAccess ? {
				id: existingAccess.id,
				successful: existingAccess.successful,
				accessDay: existingAccess.accessDay,
				accessDate: existingAccess.accessDate
			} : 'null');
			
			if (existingAccess && existingAccess.successful) {
				console.log('ACCESS DENIED - Client already accessed today');
				return this.createDenialResponseWithRecord("Cliente ya registró acceso el día de hoy", client, cedula, today, accessDay, false);
			}
			
			console.log('ACCESS CHECK PASSED - No existing successful access found');

			// 3. Check gym operating hours
			const isWithinOperatingHours = await this.checkOperatingHours();
			if (!isWithinOperatingHours) {
				return this.createDenialResponseWithRecord("Fuera del horario de atención del gimnasio", client, cedula, today, accessDay, false);
			}

			// 4. Create successful access record
			await this.gymAccessRepository.create({
				clientId: (client._id as Types.ObjectId).toString(),
				cedula,
				accessDate: today,
				accessDay,
				successful: true,
				clientName: client.userInfo?.name || "Cliente",
				clientPhoto: client.userInfo?.avatarUrl,
			});

			// 5. Update client statistics
			const updatedClient = await this.updateClientStats((client._id as Types.ObjectId).toString(), today);

			// 6. Check for rewards
			const earnedReward = await this.checkForRewards(updatedClient.consecutiveDays || 0);

			return {
				message: "Acceso autorizado - ¡Bienvenido al gimnasio!",
				authorize: true,
				client: {
					name: client.userInfo?.name || "Cliente",
					photo: client.userInfo?.avatarUrl,
					plan: client.userInfo?.plan,
					consecutiveDays: updatedClient.consecutiveDays || 0,
					totalAccesses: updatedClient.totalAccesses || 0,
				},
				reward: earnedReward,
			};

		} catch (error:any) {
			console.error("Error validating access:", error);
			
			// Create failed access record for tracking
			await this.gymAccessRepository.create({
				clientId: "",
				cedula,
				accessDate: new Date(),
				accessDay: this.formatDateAsAccessDay(new Date()),
				successful: false,
				reason: "Error interno del sistema",
				clientName: "Desconocido",
			});

			let errorMsg = "Error al validar el acceso";
			errorMsg = error ? error.message : errorMsg;

			return this.createDenialResponse(errorMsg, null);
		}
	}

	async getHistory(queryDto: GetGymAccessHistoryDto): Promise<{
		history: GymAccess[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalCount: number;
			limit: number;
		};
	}> {
		const { page = 1, limit = 10, cedula, clientName, successful } = queryDto;
		
		const filters: GymAccessFilters = {
			cedula,
			clientName,
			successful,
		};

		const result = await this.gymAccessRepository.findAll(page, limit, filters);

		return {
			history: result.gymAccesses,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(result.total / limit),
				totalCount: result.total,
				limit,
			},
		};
	}

	async getStats(filters?: GetGymAccessHistoryDto): Promise<AccessStats> {
		return this.gymAccessRepository.getStats(filters);
	}

	async getClientHistory(cedula: string, page: number = 1, limit: number = 10): Promise<{
		history: GymAccess[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalCount: number;
			limit: number;
		};
	}> {
		const client = await this.findClientByCedula(cedula);
		if (!client) {
			throw new NotFoundException("Cliente no encontrado");
		}

		const result = await this.gymAccessRepository.findByClientId((client._id as Types.ObjectId).toString(), page, limit);

		return {
			history: result.gymAccesses,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(result.total / limit),
				totalCount: result.total,
				limit,
			},
		};
	}

	private async findClientByCedula(cedula: string): Promise<ClientDocument | null> {
		return this.clientModel.findOne({ "userInfo.CI": cedula }).exec();
	}

	private async checkOperatingHours(): Promise<boolean> {
		try {
			const currentDay = this.getCurrentDayName();
			const currentTime = this.getCurrentTimeString();
			
			const schedules = await this.schedulesService.getAllSchedules(); // Get all schedules
			
			const todaySchedule = schedules.schedules.find((schedule: any) => schedule.day === currentDay);
			
			if (!todaySchedule) {
				return false; // No schedule for today
			}

			return this.isTimeInRange(currentTime, todaySchedule.startTime, todaySchedule.endTime);
		} catch (error) {
			console.error("Error checking operating hours:", error);
			return true; // Default to allow access if can't check hours
		}
	}

	private async updateClientStats(clientId: string, accessDate: Date): Promise<ClientDocument> {
		const client = await this.clientModel.findById(clientId);
		if (!client) {
			throw new NotFoundException("Cliente no encontrado");
		}

		const yesterday = new Date(accessDate);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayAccessDay = this.formatDateAsAccessDay(yesterday);

		// Check if client accessed yesterday to calculate consecutive days
		const yesterdayAccess = await this.gymAccessRepository.findByCedulaAndDay(
			client.userInfo?.CI || "",
			yesterdayAccessDay
		);

		let consecutiveDays = 1;
		if (yesterdayAccess && yesterdayAccess.successful) {
			consecutiveDays = (client.consecutiveDays || 0) + 1;
		}

		// Update client stats
		client.lastAccess = accessDate;
		client.totalAccesses = (client.totalAccesses || 0) + 1;
		client.consecutiveDays = consecutiveDays;

		return client.save();
	}

	private async checkForRewards(consecutiveDays: number): Promise<{ name: string; description: string; requiredDays: number } | undefined> {
		try {
			const reward = await this.rewardsService.findByRequiredDays(consecutiveDays);
			
			if (reward) {
				return {
					name: reward.name,
					description: reward.description,
					requiredDays: reward.requiredDays,
				};
			}

			return undefined;
		} catch (error) {
			console.error("Error checking for rewards:", error);
			return undefined;
		}
	}

	private async createDenialResponseWithRecord(
		reason: string, 
		client: ClientDocument | null, 
		cedula: string, 
		accessDate: Date, 
		accessDay: string,
		authorize: boolean = false
	): Promise<AccessValidationResponse> {
		// Create failed access record for tracking
		await this.gymAccessRepository.create({
			clientId: client ? (client._id as Types.ObjectId).toString() : "",
			cedula,
			accessDate,
			accessDay,
			successful: false,
			reason,
			clientName: client?.userInfo?.name || "Cliente no encontrado",
			clientPhoto: client?.userInfo?.avatarUrl,
		});

		return {
			message: reason,
			authorize,
			client: client ? {
				name: client.userInfo?.name || "Cliente",
				photo: client.userInfo?.avatarUrl,
				plan: client.userInfo?.plan,
				consecutiveDays: client.consecutiveDays || 0,
				totalAccesses: client.totalAccesses || 0,
			} : undefined,
		};
	}

	private createDenialResponse(reason: string, client: ClientDocument | null): AccessValidationResponse {
		const errorData = {
			message: reason,
			authorize: false,
			client: client ? {
				name: client.userInfo?.name || "Cliente",
				photo: client.userInfo?.avatarUrl,
				plan: client.userInfo?.plan,
				consecutiveDays: client.consecutiveDays || 0,
				totalAccesses: client.totalAccesses || 0,
			} : undefined,
		};
		
		const error = new Error(reason);
		(error as any).data = errorData;
		throw error;
	}

	private formatDateAsAccessDay(date: Date): string {
		return date.toISOString().split('T')[0]; // Returns "YYYY-MM-DD"
	}

	private getCurrentDayName(): string {
		const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		return days[new Date().getDay()];
	}

	private getCurrentTimeString(): string {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
	}

	private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
		const [currentHour, currentMinute] = currentTime.split(':').map(Number);
		const [startHour, startMinute] = startTime.split(':').map(Number);
		const [endHour, endMinute] = endTime.split(':').map(Number);

		const currentMinutes = currentHour * 60 + currentMinute;
		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;

		return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
	}
}
import { Injectable, Logger,NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { ClientsService } from "@/src/context/clients/clients.service";
import { ClientDocument } from "@/src/context/clients/schemas/client.schema";
import { RewardsService } from "@/src/context/rewards/rewards.service";
import { SchedulesService } from "@/src/context/schedules/schedules.service";

import { GetGymAccessHistoryDto } from "./dto/get-gym-access-history.dto";
import { ValidateAccessDto } from "./dto/validate-access.dto";
import { AccessStats,AccessValidationResponse, GymAccess } from "./entities/gym-access.entity";
import { GymAccessFilters,GymAccessRepository } from "./repositories/gym-access.repository";

// Error messages enum for consistency
enum AccessErrorMessages {
	CLIENT_NOT_FOUND = "Cliente no encontrado en el sistema",
	CLIENT_DISABLED = "Cliente deshabilitado",
	NO_AVAILABLE_DAYS = "Sin días disponibles, debes abonar el mes",
	ALREADY_ACCESSED = "Cliente ya registró acceso el día de hoy",
	OUTSIDE_OPERATING_HOURS = "Fuera del horario de atención del gimnasio",
	SYSTEM_ERROR = "Error interno del sistema",
	ACCESS_VALIDATION_ERROR = "Error al validar el acceso",
	CLIENT_NOT_FOUND_FOR_HISTORY = "Cliente no encontrado",
	NO_SCHEDULES_AVAILABLE = "No hay horarios disponibles para la hora actual o siguiente",
	NOT_ENROLLED_SCHEDULE = "No estas anotado para el horario",
	ACCESS_WINDOW_TOO_EARLY = "El ingreso a tu horario se habilitará 10 minutos antes de la hora",
	SCHEDULE_EXPIRED = "Tu horario ya no está disponible",
	SUCCESSFUL_ACCESS = "Acceso autorizado - ¡Bienvenido al gimnasio!",
	SCHEDULE_ACCESS_AUTHORIZED = "Acceso autorizado por horario",
	SCHEDULE_ACCESS_ERROR = "No se pudo verificar el horario",
	SCHEDULE_ACCESS_WINDOW_OK = "Acceso autorizado dentro del horario"
}

// Pagination result interface for reusability
interface PaginationResult<T> {
	data: T[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		limit: number;
	};
}

// Client data interface for mapping
interface ClientData {
	name: string;
	photo?: string;
	plan?: string;
	consecutiveDays: number;
	totalAccesses: number;
	availableDays: number;
}

@Injectable()
export class GymAccessService {
	private readonly logger = new Logger(GymAccessService.name);
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
		// Use Uruguay timezone for all date calculations
		const today = this.getUruguayTime();
		const accessDay = this.formatDateAsAccessDay(today, true);

		try {
			// 1. Validate client existence and status
			const clientValidation = await this.validateClient(cedula, today, accessDay);
			if (!clientValidation.isValid) {
				return clientValidation.response!;
			}
			const client = clientValidation.client!;

			// 2. Check if already accessed today
			const accessCheck = await this.checkDailyAccess(cedula, accessDay, client, today);
			if (!accessCheck.allowed) {
				return accessCheck.response!;
			}

			// 3. Validate operating hours and schedule access
			const operationalValidation = await this.validateOperationalAccess(client, cedula, today, accessDay);
			if (!operationalValidation.allowed) {
				return operationalValidation.response!;
			}

			// 4. Process successful access
			return await this.processSuccessfulAccess(client, cedula, today, accessDay);

		} catch (error: any) {
			this.logger.error('Error validating access', { error: error.message, cedula });
			return await this.handleValidationError(error, cedula, today, accessDay);
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
		const { page = 1, limit = 10, cedula, clientName, successful, startDate, endDate } = queryDto;
		
		const filters: GymAccessFilters = {
			cedula,
			clientName,
			successful,
			startDate,
			endDate,
		};

		const result = await this.gymAccessRepository.findAll(page, limit, filters);

		return {
			history: result.gymAccesses,
			pagination: this.createPaginationInfo(page, limit, result.total),
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
			throw new NotFoundException(AccessErrorMessages.CLIENT_NOT_FOUND_FOR_HISTORY);
		}

		const result = await this.gymAccessRepository.findByClientId((client._id as Types.ObjectId).toString(), page, limit);

		return {
			history: result.gymAccesses,
			pagination: this.createPaginationInfo(page, limit, result.total),
		};
	}

	// ========== CLIENT VALIDATION METHODS ==========

	private async findClientByCedula(cedula: string): Promise<ClientDocument | null> {
		return this.clientModel.findOne({ "userInfo.CI": cedula }).exec();
	}

	private async validateClient(cedula: string, today: Date, accessDay: string): Promise<{
		isValid: boolean;
		client?: ClientDocument;
		response?: AccessValidationResponse;
	}> {
		const client = await this.findClientByCedula(cedula);
		if (!client) {
			return {
				isValid: false,
				response: await this.createDenialResponseWithRecord(
					AccessErrorMessages.CLIENT_NOT_FOUND,
					null,
					cedula,
					today,
					accessDay
				)
			};
		}

		if (client.disabled) {
			return {
				isValid: false,
				response: await this.createDenialResponseWithRecord(
					AccessErrorMessages.CLIENT_DISABLED,
					client,
					cedula,
					today,
					accessDay
				)
			};
		}

		// Check if client has available days
		if (!client.availableDays || client.availableDays <= 0) {
			return {
				isValid: false,
				response: await this.createDenialResponseWithRecord(
					AccessErrorMessages.NO_AVAILABLE_DAYS,
					client,
					cedula,
					today,
					accessDay
				)
			};
		}

		return { isValid: true, client };
	}

	private async checkDailyAccess(cedula: string, accessDay: string, client: ClientDocument, today: Date): Promise<{
		allowed: boolean;
		response?: AccessValidationResponse;
	}> {
		// Check if client already accessed today (any time during the day)
		const existingAccess = await this.gymAccessRepository.findByCedulaAndDay(cedula, accessDay);
		
		if (existingAccess && existingAccess.successful) {
			return {
				allowed: false,
				response: await this.createDenialResponseWithRecord(
					"Cliente ya registró acceso el día de hoy",
					client,
					cedula,
					today,
					accessDay
				)
			};
		}

		return { allowed: true };
	}

	/**
	 * Check if client already accessed today in the specific schedule time
	 * @param cedula - Client's cedula
	 * @param accessDay - Access day in YYYY-MM-DD format
	 * @param currentHour - Current hour as string
	 * @param nextHour - Next hour as string
	 * @returns boolean indicating if client already accessed in this schedule
	 */
	private async checkScheduleSpecificAccess(cedula: string, accessDay: string, currentHour: string, nextHour: string): Promise<boolean> {
		try {
			// First get all accesses for today
			const existingAccess = await this.gymAccessRepository.findByCedulaAndDay(cedula, accessDay);
			
			if (!existingAccess || !existingAccess.successful) {
				return false;
			}
			
			// Check if the existing access was in current or next hour schedule
			if (existingAccess.scheduleStartTime) {
				const accessStartTime = this.normalizeTimeFormat(existingAccess.scheduleStartTime).split(':')[0];
				
				// Check if the previous access was in current or next hour
				if (accessStartTime === currentHour || accessStartTime === nextHour) {
					return true;
				}
			}
			
			return false;
		} catch (error) {
			this.logger.error('Error checking schedule specific access', { error, cedula, accessDay });
			return false;
		}
	}

	/**
	 * Get current schedule information for the client
	 * @param clientId - Client's ObjectId as string
	 * @returns Schedule information or null
	 */
	private async getCurrentScheduleInfo(clientId: string): Promise<{ startTime: string; endTime: string; scheduleId: string } | null> {
		try {
			const currentDay = this.getCurrentDayName();
			const currentTime = this.getCurrentTimeString();
			
			// Get schedules for current and next hour
			const relevantSchedules = await this.getRelevantSchedules(currentDay, currentTime);
			
			if (relevantSchedules.length === 0) {
				return null;
			}
			
			// Find the schedule where the client is enrolled
			const clientSchedule = relevantSchedules.find(schedule => 
				schedule.clients.some((client: any) => client.toString() === clientId)
			);
			
			if (!clientSchedule) {
				return null;
			}
			
			return {
				startTime: clientSchedule.startTime,
				endTime: clientSchedule.endTime,
				scheduleId: clientSchedule._id.toString()
			};
			
		} catch (error) {
			this.logger.error('Error getting current schedule info', { error, clientId });
			return null;
		}
	}

	private async validateOperationalAccess(client: ClientDocument, cedula: string, today: Date, accessDay: string): Promise<{
		allowed: boolean;
		response?: AccessValidationResponse;
	}> {
		// Check gym operating hours and client enrollment
		const clientId = (client._id as Types.ObjectId).toString();
		const isWithinOperatingHours = await this.checkOperatingHours(clientId);
		if (!isWithinOperatingHours) {
			return {
				allowed: false,
				response: await this.createDenialResponseWithRecord(
					AccessErrorMessages.NO_SCHEDULES_AVAILABLE,
					client,
					cedula,
					today,
					accessDay
				)
			};
		}

		// Check schedule access window (10 minutes before)
		const scheduleAccess = await this.checkScheduleAccess(clientId);
		if (!scheduleAccess.allowed) {
			return {
				allowed: false,
				response: await this.createDenialResponseWithRecord(
					scheduleAccess.message,
					client,
					cedula,
					today,
					accessDay
				)
			};
		}

		return { allowed: true };
	}

	private async processSuccessfulAccess(client: ClientDocument, cedula: string, today: Date, accessDay: string): Promise<AccessValidationResponse> {
		// Get current schedule information
		const currentScheduleInfo = await this.getCurrentScheduleInfo((client._id as Types.ObjectId).toString());
		
		// Create a UTC date that represents the same time as Uruguay local time
		// If it's 15:22 in Uruguay, we want to store 15:22 UTC
		const uruguayHour = today.getHours();
		const uruguayMinute = today.getMinutes();
		const uruguaySecond = today.getSeconds();
		const uruguayMillisecond = today.getMilliseconds();
		
		const utcDate = new Date();
		utcDate.setUTCHours(uruguayHour, uruguayMinute, uruguaySecond, uruguayMillisecond);
		
		await this.gymAccessRepository.create({
			clientId: (client._id as Types.ObjectId).toString(),
			cedula,
			accessDate: utcDate,
			accessDay,
			successful: true,
			clientName: client.userInfo?.name || "Cliente",
			clientPhoto: client.userInfo?.avatarUrl,
			scheduleStartTime: currentScheduleInfo?.startTime,
			scheduleEndTime: currentScheduleInfo?.endTime,
			scheduleId: currentScheduleInfo?.scheduleId,
		});

		// Update client statistics and decrement available days
		const updatedClient = await this.updateClientStats((client._id as Types.ObjectId).toString(), today);

		// Check for rewards
		const earnedReward = await this.checkForRewards(updatedClient.consecutiveDays || 0);

		return {
			message: AccessErrorMessages.SUCCESSFUL_ACCESS,
			authorize: true,
			client: this.mapClientData(updatedClient),
			reward: earnedReward,
		};
	}

	private async handleValidationError(error: any, cedula: string, today: Date, accessDay: string): Promise<AccessValidationResponse> {
		// Create failed access record for tracking - create UTC date that represents Uruguay local time
		const uruguayHour = today.getHours();
		const uruguayMinute = today.getMinutes();
		const uruguaySecond = today.getSeconds();
		const uruguayMillisecond = today.getMilliseconds();
		
		const utcDate = new Date();
		utcDate.setUTCHours(uruguayHour, uruguayMinute, uruguaySecond, uruguayMillisecond);
		
		await this.gymAccessRepository.create({
			clientId: "",
			cedula,
			accessDate: utcDate,
			accessDay,
			successful: false,
			reason: AccessErrorMessages.SYSTEM_ERROR,
			clientName: "Desconocido",
		});

		const errorMsg = error?.message || AccessErrorMessages.ACCESS_VALIDATION_ERROR;
		return this.createDenialResponse(errorMsg, null);
	}

	// ========== UTILITY METHODS ==========

	private mapClientData(client: ClientDocument): ClientData {
		return {
			name: client.userInfo?.name || "Cliente",
			photo: client.userInfo?.avatarUrl,
			plan: client.userInfo?.plan,
			consecutiveDays: client.consecutiveDays || 0,
			totalAccesses: client.totalAccesses || 0,
			availableDays: client.availableDays || 0,
		};
	}

	private createPaginationInfo(page: number, limit: number, total: number) {
		return {
			currentPage: page,
			totalPages: Math.ceil(total / limit),
			totalCount: total,
			limit,
		};
	}

	// ========== SCHEDULE AND OPERATING HOURS METHODS ==========

	private async checkOperatingHours(clientId?: string): Promise<boolean> {
		try {
			let currentDay = this.getCurrentDayName();
			if(currentDay == "Sabado") currentDay = "Sábado"
			const schedules = await this.schedulesService.getAllSchedules();
			
			if (!schedules || !Array.isArray(schedules)) {
				return true;
			}

			const todaySchedules = schedules.filter((schedule: any) => schedule.day === currentDay);
			
			if (!todaySchedules || todaySchedules.length === 0) {
				return false;
			}

			// Use local timezone for hour calculation
			const localTime = this.getUruguayTime();
			const currentHour = localTime.getHours();
			const nextHour = currentHour + 1;
			
			const relevantSchedules = todaySchedules.filter((schedule: any) => {
				const scheduleStartHour = parseInt(schedule.startTime);
				return scheduleStartHour === currentHour || scheduleStartHour === nextHour;
			});
			
			if (!relevantSchedules || relevantSchedules.length === 0) {
				return false;
			}
			
			if (clientId) {
				const isClientEnrolled = relevantSchedules.some((schedule: any) => 
					schedule.clients && schedule.clients.includes(clientId)
				);
				return isClientEnrolled;
			}
			
			return relevantSchedules.length > 0;
		} catch (error) {
			this.logger.error('Error checking operating hours', { error });
			return true;
		}
	}

	private async updateClientStats(clientId: string, accessDate: Date): Promise<ClientDocument> {
		const client = await this.clientModel.findById(clientId);
		if (!client) {
			throw new NotFoundException("Cliente no encontrado");
		}

		// Calculate yesterday in Uruguay timezone
		const yesterday = new Date(accessDate.getTime() - (24 * 60 * 60 * 1000));
		const yesterdayAccessDay = this.formatDateAsAccessDay(yesterday, true);

		// Check if client accessed yesterday to calculate consecutive days
		const yesterdayAccess = await this.gymAccessRepository.findByCedulaAndDay(
			client.userInfo?.CI || "",
			yesterdayAccessDay
		);

		let consecutiveDays = 1;
		if (yesterdayAccess && yesterdayAccess.successful) {
			consecutiveDays = (client.consecutiveDays || 0) + 1;
		}

		// Update client stats - create UTC date that represents Uruguay local time
		const uruguayHour = accessDate.getHours();
		const uruguayMinute = accessDate.getMinutes();
		const uruguaySecond = accessDate.getSeconds();
		const uruguayMillisecond = accessDate.getMilliseconds();
		
		const utcLastAccess = new Date();
		utcLastAccess.setUTCHours(uruguayHour, uruguayMinute, uruguaySecond, uruguayMillisecond);
		
		client.lastAccess = utcLastAccess;
		client.totalAccesses = (client.totalAccesses || 0) + 1;
		client.consecutiveDays = consecutiveDays;
		
		// Add points for gym access (1 point per access)
		const POINTS_PER_ACCESS = 1;
		client.availablePoints = (client.availablePoints || 0) + POINTS_PER_ACCESS;
		

		return client.save();
	}

	// ========== REWARDS AND STATISTICS METHODS ==========

	private async checkForRewards(consecutiveDays: number): Promise<{ name: string; description: string; requiredDays: number } | undefined> {
		try {
			const reward = await this.rewardsService.findByRequiredDays(consecutiveDays);
			
			if (reward) {
				return {
					name: reward.name,
					description: reward.description || '', // Handle undefined description
					requiredDays: reward.pointsRequired, // Using pointsRequired as proxy for requiredDays
				};
			}

			return undefined;
		} catch (error) {
			this.logger.error('Error checking for rewards', { error, consecutiveDays });
			return undefined;
		}
	}

	// ========== RESPONSE CREATION METHODS ==========

	private async createDenialResponseWithRecord(
		reason: string, 
		client: ClientDocument | null, 
		cedula: string, 
		accessDate: Date, 
		accessDay: string,
		authorize: boolean = false
	): Promise<AccessValidationResponse> {
		// Create failed access record for tracking - create UTC date that represents Uruguay local time
		const uruguayHour = accessDate.getHours();
		const uruguayMinute = accessDate.getMinutes();
		const uruguaySecond = accessDate.getSeconds();
		const uruguayMillisecond = accessDate.getMilliseconds();
		
		const utcDate = new Date();
		utcDate.setUTCHours(uruguayHour, uruguayMinute, uruguaySecond, uruguayMillisecond);
		
		await this.gymAccessRepository.create({
			clientId: client ? (client._id as Types.ObjectId).toString() : "",
			cedula,
			accessDate: utcDate,
			accessDay,
			successful: false,
			reason,
			clientName: client?.userInfo?.name || "Cliente no encontrado",
			clientPhoto: client?.userInfo?.avatarUrl,
		});

		return {
			message: reason,
			authorize,
			client: client ? this.mapClientData(client) : undefined,
		};
	}

	private createDenialResponse(reason: string, client: ClientDocument | null): AccessValidationResponse {
		return {
			message: reason,
			authorize: false,
			client: client ? this.mapClientData(client) : undefined,
		};
	}

	// ========== TIME AND DATE UTILITY METHODS ==========

	/**
	 * Get current date and time in Uruguay timezone (UTC-3)
	 * Since the system is already running in Uruguay, we just use local time
	 * @returns Date object representing the current local time
	 */
	private getUruguayTime(): Date {
		// If the system is already in Uruguay timezone, just return current time
		return new Date();
	}

	/**
	 * Format date as access day in local timezone
	 * @param date - Date to format
	 * @param isAlreadyAdjusted - Not used anymore since we use local time
	 * @returns String in YYYY-MM-DD format for local date
	 */
	private formatDateAsAccessDay(date: Date, isAlreadyAdjusted: boolean = false): string {
		// Use local timezone formatting
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	private getCurrentDayName(): string {
		const days = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
		const localTime = this.getUruguayTime();
		return days[localTime.getDay()];
	}

	private getCurrentTimeString(): string {
		const localTime = this.getUruguayTime();
		return `${localTime.getHours().toString().padStart(2, '0')}:${localTime.getMinutes().toString().padStart(2, '0')}`;
	}

	/**
	 * Normalize time format to HH:MM
	 * Converts "6" to "06:00", "19" to "19:00", keeps "19:30" as "19:30"
	 */
	private normalizeTimeFormat(time: string): string {
		if (!time) return time;
		
		// If already in HH:MM format, return as is
		if (time.includes(':')) {
			return time;
		}
		
		// If it's just a number (hour), add :00 for minutes
		const hour = parseInt(time, 10);
		if (!isNaN(hour) && hour >= 0 && hour <= 23) {
			return `${hour.toString().padStart(2, '0')}:00`;
		}
		
		// Return original if can't normalize
		return time;
	}

	/**
	 * Check if client has access to current or next hour schedule
	 * @param clientId - Client's ObjectId as string
	 * @returns Object with allowed status and message
	 */
	private async checkScheduleAccess(clientId: string): Promise<{ allowed: boolean; message: string }> {
		try {
			let currentDay = this.getCurrentDayName();
			if(currentDay == "Sabado") currentDay = "Sábado"
			const currentTime = this.getCurrentTimeString();
			
			// Get schedules for current and next hour
			const relevantSchedules = await this.getRelevantSchedules(currentDay, currentTime);

			if (relevantSchedules.length === 0) {
				return {
					allowed: false,
					message: AccessErrorMessages.NO_SCHEDULES_AVAILABLE
				};
			}
			
			// Check if client is enrolled in any relevant schedule
			const clientSchedule = relevantSchedules.find(schedule => 
				schedule.clients.some((client: any) => client.toString() === clientId)
			);
			
			if (!clientSchedule) {
				// Find the most relevant schedule to show in error message
				const nearestSchedule = relevantSchedules[0];
				return {
					allowed: false,
					message: `${AccessErrorMessages.NOT_ENROLLED_SCHEDULE}: ${nearestSchedule.startTime} - ${nearestSchedule.endTime}`
				};
			}
			
			// Check if client is within allowed time window
			const accessWindow = this.calculateAccessWindow(clientSchedule.startTime, clientSchedule.endTime, currentTime);
			
			if (!accessWindow.allowed) {
				return {
					allowed: false,
					message: accessWindow.message
				};
			}
			
			return {
				allowed: true,
				message: AccessErrorMessages.SCHEDULE_ACCESS_AUTHORIZED
			};
			
		} catch (error) {
			this.logger.error('Error checking schedule access', { error, clientId });
			return {
				allowed: true, // Default to allow access if can't check schedules
				message: AccessErrorMessages.SCHEDULE_ACCESS_ERROR
			};
		}
	}

	/**
	 * Get schedules for current hour and next hour
	 * @param currentDay - Current day name
	 * @param currentTime - Current time in HH:MM format
	 * @returns Array of relevant schedules
	 */
	private async getRelevantSchedules(currentDay: string, currentTime: string): Promise<any[]> {
		try {
			const schedules = await this.schedulesService.getAllSchedules();
			
			if (!schedules || !Array.isArray(schedules)) {
				return [];
			}
			
			const todaySchedules = schedules.filter((schedule: any) => schedule.day === currentDay);
			
			const [currentHour] = currentTime.split(':').map(Number);
			const nextHour = currentHour + 1;

			// Filter schedules that start in current hour or next hour
			return todaySchedules.filter((schedule: any) => {
				const [scheduleHour] = schedule.startTime.split(':').map(Number);
				return scheduleHour === currentHour || scheduleHour === nextHour;
			});
			
		} catch (error) {
			this.logger.error('Error getting relevant schedules', { error, currentDay, currentTime });
			return [];
		}
	}

	/**
	 * Calculate if current time is within allowed access window
	 * @param startTime - Schedule start time
	 * @param endTime - Schedule end time
	 * @param currentTime - Current time
	 * @returns Object with allowed status and message
	 */
	private calculateAccessWindow(startTime: string, endTime: string, currentTime: string): { allowed: boolean; message: string } {
		// Validate input parameters
		if (!startTime || !endTime || !currentTime) {
			this.logger.error('Invalid time parameters', { startTime, endTime, currentTime });
			return {
				allowed: false,
				message: AccessErrorMessages.SCHEDULE_ACCESS_ERROR
			};
		}

		// Normalize time formats - handle both "HH:MM" and "H" formats
		const normalizedStartTime = this.normalizeTimeFormat(startTime);
		const normalizedEndTime = this.normalizeTimeFormat(endTime);
		const normalizedCurrentTime = this.normalizeTimeFormat(currentTime);

		const [currentHour, currentMinute] = normalizedCurrentTime.split(':').map(Number);
		const [startHour, startMinute] = normalizedStartTime.split(':').map(Number);
		const [endHour, endMinute] = normalizedEndTime.split(':').map(Number);

		// Validate that all time components are valid numbers
		if (isNaN(currentHour) || isNaN(currentMinute) || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
			this.logger.error('Invalid time format', { startTime, endTime, currentTime, normalizedStartTime, normalizedEndTime, normalizedCurrentTime });
			return {
				allowed: false,
				message: AccessErrorMessages.SCHEDULE_ACCESS_ERROR
			};
		}

		const currentMinutes = currentHour * 60 + currentMinute;
		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;

		// Allow access 10 minutes before start time
		const earlyAccessMinutes = startMinutes - 10;
		// Allow access up to 30 minutes after start time
		const lateAccessMinutes = startMinutes + 30;

		// Check if too early (more than 10 minutes before)
		if (currentMinutes < earlyAccessMinutes) {
			return {
				allowed: false,
				message: AccessErrorMessages.ACCESS_WINDOW_TOO_EARLY
			};
		}

		// Check if within allowed window (10 minutes before to 30 minutes after start)
		if (currentMinutes >= earlyAccessMinutes && currentMinutes <= lateAccessMinutes) {
			return {
				allowed: true,
				message: AccessErrorMessages.SCHEDULE_ACCESS_WINDOW_OK
			};
		}

		// If past the allowed window
		return {
			allowed: false,
			message: `Tu horario ${startTime} - ${endTime} ya no está disponible`
		};
	}


}
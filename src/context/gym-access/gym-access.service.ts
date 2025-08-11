import { Injectable, NotFoundException, Logger } from "@nestjs/common";
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

// Error messages enum for consistency
enum AccessErrorMessages {
	CLIENT_NOT_FOUND = "Cliente no encontrado en el sistema",
	CLIENT_DISABLED = "Cliente deshabilitado",
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
		const today = new Date();
		const accessDay = this.formatDateAsAccessDay(today);

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

		return { isValid: true, client };
	}

	private async checkDailyAccess(cedula: string, accessDay: string, client: ClientDocument, today: Date): Promise<{
		allowed: boolean;
		response?: AccessValidationResponse;
	}> {
		// Get current hour to check for schedule-specific access
		const currentHour = new Date().getHours().toString();
		const nextHour = (new Date().getHours() + 1).toString();
		
		// Check if client already accessed today in current or next hour schedule
		const hasAccessedInCurrentSchedule = await this.checkScheduleSpecificAccess(cedula, accessDay, currentHour, nextHour);
		
		if (hasAccessedInCurrentSchedule) {
			return {
				allowed: false,
				response: await this.createDenialResponseWithRecord(
					`Ya registraste acceso hoy en el horario ${currentHour}:00 - ${parseInt(currentHour) + 1}:00`,
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
		
		// Create successful access record
		await this.gymAccessRepository.create({
			clientId: (client._id as Types.ObjectId).toString(),
			cedula,
			accessDate: today,
			accessDay,
			successful: true,
			clientName: client.userInfo?.name || "Cliente",
			clientPhoto: client.userInfo?.avatarUrl,
			scheduleStartTime: currentScheduleInfo?.startTime,
			scheduleEndTime: currentScheduleInfo?.endTime,
			scheduleId: currentScheduleInfo?.scheduleId,
		});

		// Update client statistics
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
		// Create failed access record for tracking
		await this.gymAccessRepository.create({
			clientId: "",
			cedula,
			accessDate: today,
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
			const currentDay = this.getCurrentDayName();
			const schedules = await this.schedulesService.getAllSchedules();
			
			if (!schedules || !Array.isArray(schedules)) {
				return true;
			}

			const todaySchedules = schedules.filter((schedule: any) => schedule.day === currentDay);
			
			if (!todaySchedules || todaySchedules.length === 0) {
				return false;
			}

			const currentHour = new Date().getHours();
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

	// ========== REWARDS AND STATISTICS METHODS ==========

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

	private formatDateAsAccessDay(date: Date): string {
		return date.toISOString().split('T')[0]; // Returns "YYYY-MM-DD"
	}

	private getCurrentDayName(): string {
		const days = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
		return days[new Date().getDay()];
	}

	private getCurrentTimeString(): string {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
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
			const currentDay = this.getCurrentDayName();
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

	private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
		// Validate input parameters
		if (!currentTime || !startTime || !endTime) {
			this.logger.error('Invalid time parameters in isTimeInRange', { currentTime, startTime, endTime });
			return false;
		}

		// Normalize time formats - handle both "HH:MM" and "H" formats
		const normalizedCurrentTime = this.normalizeTimeFormat(currentTime);
		const normalizedStartTime = this.normalizeTimeFormat(startTime);
		const normalizedEndTime = this.normalizeTimeFormat(endTime);

		const [currentHour, currentMinute] = normalizedCurrentTime.split(':').map(Number);
		const [startHour, startMinute] = normalizedStartTime.split(':').map(Number);
		const [endHour, endMinute] = normalizedEndTime.split(':').map(Number);

		// Validate that all time components are valid numbers
		if (isNaN(currentHour) || isNaN(currentMinute) || isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
			this.logger.error('Invalid time format in isTimeInRange', { currentTime, startTime, endTime, normalizedCurrentTime, normalizedStartTime, normalizedEndTime });
			return false;
		}

		const currentMinutes = currentHour * 60 + currentMinute;
		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;

		return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
	}
}
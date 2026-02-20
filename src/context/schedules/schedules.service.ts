import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { SCHEDULE_REPOSITORY } from "@/src/context/schedules/repositories/mongo-schedule.repository";
import { Schedule } from "@/src/context/schedules/schemas/schedule.schema";

import { EDay } from "@/src/context/shared/enums/days.enum";
import { getUruguayTime } from "@/src/context/shared/utils/date.utils";
import { CLIENT_REPOSITORY } from "../clients/repositories/clients.repository";
import { ConfigService } from "../config/config.service";
import { UpdateConfigDto } from "../config/dto/update-config.dto";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

@Injectable()
export class SchedulesService {
	constructor(
		@Inject(SCHEDULE_REPOSITORY)
		private readonly scheduleRepository: any,
		@Inject(ConfigService)
		private readonly configService: ConfigService,
		@Inject(CLIENT_REPOSITORY)
		private readonly clientRepository: any,
	) { }

	async createSchedule(createScheduleDto: CreateScheduleDto) {
		if (!createScheduleDto) {
			throw new BadRequestException("Datos de horario inválidos");
		}
		return await this.scheduleRepository.createSchedule(createScheduleDto);
	}

	async deleteSchedule(id: string) {
		if (!id) {
			throw new BadRequestException("ID de horario es requerido");
		}

		const schedule = await this.scheduleRepository.findById(id);
		if (!schedule) {
			throw new NotFoundException(`Horario con ID ${id} no encontrado`);
		}
		return this.scheduleRepository.deleteSchedule(id);
	}

	async updateSchedule(scheduleId: string, updateData: UpdateScheduleDto) {
		if (!scheduleId || !updateData) {
			throw new BadRequestException("ID de horario y datos de actualización son requeridos");
		}
		//TODO: Change to client repo
		// if(updateData.clients) {
		//   for (const clientId of updateData.clients) {
		//     const clientExists = await this.scheduleRepository.findById(clientId);
		//     if (!clientExists) {
		//       throw new NotFoundException(`Client with ID ${clientId} not found`);
		//     }
		//   }
		// }
		const schedule = await this.scheduleRepository.findById(scheduleId);
		if (!schedule) {
			throw new NotFoundException(`Horario con ID ${scheduleId} no encontrado`);
		}
		return this.scheduleRepository.updateSchedule(scheduleId, updateData);
	}

	async getSchedule(id: string) {
		if (!id) {
			throw new BadRequestException("ID de horario es requerido");
		}

		const schedule = await this.scheduleRepository.findById(id);
		if (!schedule) {
			throw new NotFoundException(`Schedule with ID ${id} not found`);
		}
		return schedule;
	}

	async getAllSchedules() {
		return await this.scheduleRepository.getSchedules();
	}

	/**
	 * Get only enabled schedules
	 * @returns Array of enabled schedules
	 */
	async getEnabledSchedules() {
		const allSchedules = await this.scheduleRepository.getSchedules();
		return allSchedules.filter((schedule: any) => !schedule.disabled);
	}

	async deleteAllClientSchedules(clientId: string) {
		if (!clientId) {
			throw new BadRequestException("ID de cliente es requerido");
		}

		const result =
			await this.scheduleRepository.deleteAllClientSchedules(clientId);

		if (result.modifiedCount === 0) {
			throw new NotFoundException(
				`No schedules found with client ID ${clientId}`,
			);
		}

		return { message: `Client with ID ${clientId} removed from all schedules` };
	}

	async assignClientToSchedule(scheduleId: string, clienstIds: { clients: string[] }) {
		if (!scheduleId || !clienstIds) {
			throw new BadRequestException("ID de horario e ID de cliente son requeridos");
		}

		const schedule = await this.scheduleRepository.findById(scheduleId);

		if (!schedule) {
			throw new NotFoundException(`Horario con ID ${scheduleId} no encontrado`);
		}

		for (const clientId of clienstIds.clients) {
			const availableDays = await this.clientRepository.getClientAvailableDays(clientId);
			if (availableDays.availableDays <= 0) {
				throw new BadRequestException(`El cliente ${clientId} no tiene días disponibles suficientes`);
			}
		}

		if (schedule.clients.length + clienstIds.clients.length > schedule.maxCount) {
			throw new BadRequestException(`El horario ha alcanzado su capacidad máxima`);
		}


		for (const clientId of clienstIds.clients) {
			const clientSchedules = await this.scheduleRepository.getSchedulesByUserId(clientId);
			const hasScheduleOnSameDay = clientSchedules.some(
				(clientSchedule: Schedule) => clientSchedule.day === schedule.day
			);

			if (hasScheduleOnSameDay) {
				throw new BadRequestException(
					`El cliente ${clientId} ya tiene un horario asignado para el día ${schedule.day}`
				);
			}
		}

		//TODO: Change to clientRepository
		// const clientExists = await this.scheduleRepository.findById(clientId);
		// if (!clientExists) {
		//   throw new NotFoundException(`Client with ID ${clientId} not found`);
		// }

		return this.scheduleRepository.assignClientToSchedule(
			scheduleId,
			clienstIds,
		);
	}

	async deleteClientFromSchedule(scheduleId: string, clientId: string, isClient: boolean) {

		if (!scheduleId || !clientId) {
			throw new BadRequestException("ID de horario e ID de cliente son requeridos");
		}

		const schedule = await this.scheduleRepository.findById(scheduleId);
		if (!schedule) {
			throw new NotFoundException(`Horario con ID ${scheduleId} no encontrado`);
		}

		let scheduleDay = schedule.day;


		if (scheduleDay === 'Miércoles')
			scheduleDay = 'Miercoles';
		else if (scheduleDay === 'Sábado')
			scheduleDay = 'Sabado';


		if (isClient) {
			let canCancel = this.canCancelAppointment(scheduleDay, schedule.startTime);
			if (!canCancel)
				console.log(`El usuario ${clientId} intentó cancelar un turno para el día ${schedule.day} a las ${schedule.startTime}:00, pero el límite para cancelar ya pasó.`);

			throw new BadRequestException(`El límite para cancelar el turno ha pasado. Intente nuevamente a partir del próximo domingo.`);
		}



		return await this.scheduleRepository.deleteClientFromSchedule(
			scheduleId,
			clientId,
		);
	}

	async populateSchedulesByConfig() {
		const schedules = await this.getAllSchedules();
		if (schedules.length > 0) {
			throw new BadRequestException("La colección de horarios no está vacía");
		}

		const config = await this.configService.getConfigs();
		if (config.schedule.length === 0) {
			throw new BadRequestException("La colección de configuración de horarios está vacía");
		}

		const scheduleConfig = config.schedule;
		for (const day of scheduleConfig) {
			for (const hour of day.hours) {
				const schedule = {
					day: day.day,
					startTime: Number(hour).toString(),
					endTime: (Number(hour) + 1).toString(),
					clients: [],
					maxCount: day.maxCount,
					disabled: false,
				};
				await this.createSchedule(schedule);
			}
		}
		return "Horarios creados exitosamente";
	}

	async updateScheduleConfig(id: string, updateConfigDto: UpdateConfigDto) {
		// Update the configuration
		await this.configService.update(id, updateConfigDto);
		const config = await this.configService.getConfigs();

		if (!config.schedule || config.schedule.length === 0) {
			throw new BadRequestException("La colección de configuración de horarios está vacía");
		}

		const scheduleConfig = config.schedule; // Array of days with their hours and maxCount
		const schedules = await this.getAllSchedules(); // Fetch all schedules from the database

		// Build a set of schedule identifiers from the config
		const configScheduleSet = new Set<string>();
		for (const day of scheduleConfig) {
			for (const hour of day.hours) {
				const scheduleIdentifier = `${day.day}-${hour}`;
				configScheduleSet.add(scheduleIdentifier);
			}
		}

		// Build a map of schedules from the database for quick access
		const dbScheduleMap = new Map<string, any>();
		for (const schedule of schedules) {
			const scheduleIdentifier = `${schedule.day}-${schedule.startTime}`;
			dbScheduleMap.set(scheduleIdentifier, schedule);
		}

		// Schedules to delete: schedules in the database not in the config
		const schedulesToDelete = schedules.filter((schedule: any) => {
			const scheduleIdentifier = `${schedule.day}-${schedule.startTime}`;
			return !configScheduleSet.has(scheduleIdentifier);
		});

		// Schedules to create: schedules in the config not in the database
		const schedulesToCreate = [];
		for (const day of scheduleConfig) {
			for (const hour of day.hours) {
				const scheduleIdentifier = `${day.day}-${hour}`;
				if (dbScheduleMap.has(scheduleIdentifier)) {
					// Update maxCount if it has changed
					const existingSchedule = dbScheduleMap.get(scheduleIdentifier);
					if (existingSchedule.maxCount !== day.maxCount) {
						existingSchedule.maxCount = day.maxCount;
						await this.updateSchedule(existingSchedule._id, {
							maxCount: day.maxCount,
						});
					}
				} else {
					// Create a new schedule object
					const newSchedule = {
						day: day.day,
						startTime: Number(hour).toString(),
						endTime: (Number(hour) + 1).toString(),
						clients: [], // No clients yet
						maxCount: day.maxCount,
						disabled: false, // New schedules are enabled by default
					};
					schedulesToCreate.push(newSchedule);
				}
			}
		}

		// Delete schedules, but check if they have clients assigned
		for (const schedule of schedulesToDelete) {
			if (schedule.clients && schedule.clients.length > 0) {
				// Optionally, you can decide how to handle this case
				// For now, we'll skip deleting schedules with assigned clients
				continue;
			}
			await this.deleteSchedule(schedule._id);
		}
		// Create new schedules
		for (const schedule of schedulesToCreate) {
			await this.createSchedule(schedule);
		}
		return "Horarios actualizados exitosamente";
	}

	async getUserScheduleDays(userId: string) {
		if (!userId) {
			throw new BadRequestException("ID de usuario es requerido");
		}

		if (!/^[\dA-Fa-f]{24}$/.test(userId)) {
			throw new BadRequestException(`Formato de ID de usuario inválido: ${userId}`);
		}

		try {
			const schedules =
				await this.scheduleRepository.getSchedulesByUserId(userId);

			if (!schedules || schedules.length === 0) {
				return {
					message: `No schedules found for user ID ${userId}`,
					data: [],
				};
			}

			const validSchedules = schedules.filter(
				(schedule: Schedule) =>
					schedule && schedule.day && schedule.startTime && schedule.endTime,
			);

			if (validSchedules.length < schedules.length) {
				console.warn(
					`${schedules.length - validSchedules.length} schedules had invalid structure`,
				);
			}

			return {
				message: `Found ${validSchedules.length} schedules for user ID ${userId}`,
				data: validSchedules.map((schedule: Schedule) => ({
					day: schedule.day,
					startTime: schedule.startTime,
					endTime: schedule.endTime,
					scheduleId: schedule._id,
				})),
			};
		} catch (error: unknown) {
			console.error(`Error fetching schedules for user ${userId}:`, error);
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			throw new BadRequestException(
				`Error fetching schedules: ${errorMessage}`,
			);
		}
	}

	/**
	 * Disable all schedules for a specific day without removing clients
	 * @param day - Day to disable (e.g., "Monday", "Tuesday", etc.)
	 * @param disabled - Boolean indicating if the day should be disabled
	 * @param disabledReason - Optional reason for disabling the day
	 * @returns Success message
	 */
	async toggleDayDisabled(day: string, disabled: boolean, disabledReason?: string) {
		if (!day) {
			throw new BadRequestException("Day is required");
		}

		try {
			// Get all schedules for the specified day
			const daySchedules = await this.scheduleRepository.getSchedulesByDay(day);

			if (!daySchedules || daySchedules.length === 0) {
				throw new NotFoundException(`No schedules found for day: ${day}`);
			}

			// Update all schedules for the day
			const updatePromises = daySchedules.map(async (schedule: any) => {
				const updateData: any = { disabled };

				// Add or remove disabled reason based on the disabled status
				if (disabled && disabledReason) {
					updateData.disabledReason = disabledReason;
				} else if (!disabled) {
					updateData.disabledReason = null; // Clear the reason when enabling
				}

				return this.scheduleRepository.updateSchedule(schedule._id, updateData);
			});

			await Promise.all(updatePromises);

			const action = disabled ? "disabled" : "enabled";
			const reasonText = disabled && disabledReason ? ` (Reason: ${disabledReason})` : '';
			return {
				message: `Day ${day} has been ${action}${reasonText}`,
				affectedSchedules: daySchedules.length
			};

		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			throw new BadRequestException(`Error toggling day status: ${errorMessage}`);
		}
	}

	/**
	 * Get all disabled days
	 * @returns Array of disabled days with their schedules
	 */
	async getDisabledDays() {
		try {
			const disabledSchedules = await this.scheduleRepository.getDisabledSchedules();

			// Group by day
			const disabledByDay = disabledSchedules.reduce((acc: any, schedule: any) => {
				if (!acc[schedule.day]) {
					acc[schedule.day] = {
						schedules: [],
						disabledReason: schedule.disabledReason || null
					};
				}
				acc[schedule.day].schedules.push({
					scheduleId: schedule._id,
					startTime: schedule.startTime,
					endTime: schedule.endTime,
					maxCount: schedule.maxCount,
					clientsCount: schedule.clients?.length || 0
				});
				return acc;
			}, {});

			return {
				message: "Disabled days retrieved successfully",
				data: disabledByDay
			};

		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			throw new BadRequestException(`Error retrieving disabled days: ${errorMessage}`);
		}
	}

	/**
	 * Toggle disabled status for a specific schedule without removing clients
	 * @param scheduleId - Schedule ID to toggle
	 * @param disabled - Boolean indicating if the schedule should be disabled
	 * @param disabledReason - Optional reason for disabling the schedule
	 * @returns Updated schedule
	 */
	async toggleScheduleDisabled(scheduleId: string, disabled: boolean, disabledReason?: string) {
		if (!scheduleId) {
			throw new BadRequestException("Schedule ID is required");
		}

		try {
			const schedule = await this.scheduleRepository.findById(scheduleId);
			if (!schedule) {
				throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
			}

			const updateData: any = { disabled };

			// Add or remove disabled reason based on the disabled status
			if (disabled && disabledReason) {
				updateData.disabledReason = disabledReason;
			} else if (!disabled) {
				updateData.disabledReason = null; // Clear the reason when enabling
			}

			const updatedSchedule = await this.scheduleRepository.updateSchedule(scheduleId, updateData);

			const action = disabled ? "disabled" : "enabled";
			const reasonText = disabled && disabledReason ? ` (Reason: ${disabledReason})` : '';
			return {
				message: `Schedule has been ${action}${reasonText}`,
				schedule: updatedSchedule
			};

		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			throw new BadRequestException(`Error toggling schedule status: ${errorMessage}`);
		}
	}

	async getSchedulesByUserId(userId: string): Promise<Schedule[]> {
		if (!userId) {
			return [];
		}
		return await this.scheduleRepository.getSchedulesByUserId(userId);
	}



	canCancelAppointment(appointmentDay: EDay, appointmentHour: number): boolean {
		const daysOfWeek: EDay[] = [
			EDay.SUNDAY,
			EDay.MONDAY,
			EDay.TUESDAY,
			EDay.WEDNESDAY,
			EDay.THURSDAY,
			EDay.FRIDAY,
			EDay.SATURDAY,
		];

		const now: Date = getUruguayTime();
		const currentDayIndex: number = now.getDay();
		const currentHour: number = now.getHours();

		const appointmentDayIndex: number = daysOfWeek.indexOf(appointmentDay);

		console.log(`Son las ${currentHour} del dia ${currentDayIndex}, el turno es a las ${appointmentHour} del dia ${appointmentDayIndex} y tiene tiempo hasta las ${appointmentHour - 1}.`);



		if (appointmentDayIndex === -1) {
			throw new Error('Día de la semana inválido');
		}

		// Si el día del turno ya pasó
		if (appointmentDayIndex < currentDayIndex) {
			return false;
		}

		// Si es el mismo día
		if (appointmentDayIndex === currentDayIndex) {
			const limitHour: number = appointmentHour - 1;

			// Si ya llegamos a la hora límite o la pasamos
			if (currentHour >= limitHour) {
				return false;
			}
		}

		return true;
	}
}

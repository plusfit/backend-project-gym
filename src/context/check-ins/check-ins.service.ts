import {
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	NotFoundException,
	BadRequestException,
} from "@nestjs/common";

import { CreateCheckInDto } from "@/src/context/check-ins/dto/create-check-in.dto";
import { GetCheckInsDto } from "@/src/context/check-ins/dto/get-check-ins.dto";
import { CheckIn } from "@/src/context/check-ins/entities/check-in.entity";
import {
	CHECK_IN_REPOSITORY,
	CheckInFilters,
} from "@/src/context/check-ins/repositories/check-in.repository";
import type { CheckInRepository } from "@/src/context/check-ins/repositories/check-in.repository";
import { ClientsService } from "@/src/context/clients/clients.service";

@Injectable()
export class CheckInsService {
	constructor(
		@Inject(CHECK_IN_REPOSITORY)
		private readonly checkInRepository: CheckInRepository,
		private readonly clientsService: ClientsService,
	) {}

	async createCheckIn(createCheckInDto: CreateCheckInDto): Promise<{
		message: string;
	}> {
		try {
			// 1. Validar que el cliente existe y está activo
			const client = await this.clientsService.findByCI(
				createCheckInDto.ci,
			);

			if (!client) {
				throw new NotFoundException(
					`Cliente con CI ${createCheckInDto.ci} no encontrado`,
				);
			}

			if (client.disabled) {
				throw new BadRequestException(
					"El cliente está deshabilitado y no puede ingresar",
				);
			}

			// 2. Verificar si ya tiene un check-in hoy
			const todayCheckIn = await this.checkInRepository.getTodayCheckInByCI(
				createCheckInDto.ci,
			);

			if (todayCheckIn) {
				throw new BadRequestException(
					"El cliente ya registró un ingreso el día de hoy",
				);
			}

			// 3. Crear el registro de ingreso
			const checkIn = await this.checkInRepository.createCheckIn(
				createCheckInDto,
			);

			// 4. Actualizar el cliente: incrementar días y actualizar último ingreso
			await this.clientsService.update(
				client._id.toString(),
				{
					totalDays: (client.totalDays || 0) + 1,
					lastCheckIn: checkIn.checkInDate,
				} as any,
			);

			// 5. Devolver mensaje de bienvenida con el nombre del cliente
			const clientName = client.userInfo?.name || "Cliente";
			return {
				message: `Bienvenido ${clientName}`,
			};
		} catch (error: any) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new HttpException(
				`Error al registrar el ingreso: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findAll(getCheckInsDto: GetCheckInsDto) {
		try {
			const { page = 1, limit = 10, ci, startDate, endDate } = getCheckInsDto;
			const offset = (page - 1) * limit;

			const filters: CheckInFilters = {};

			if (ci) {
				filters.ci = ci;
			}

			if (startDate) {
				filters.startDate = new Date(startDate);
			}

			if (endDate) {
				filters.endDate = new Date(endDate);
			}

			const [data, total] = await Promise.all([
				this.checkInRepository.getCheckIns(offset, limit, filters),
				this.checkInRepository.countCheckIns(filters),
			]);

			return {
				data,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			};
		} catch (error: any) {
			throw new HttpException(
				`Error al obtener los ingresos: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findOne(id: string): Promise<CheckIn> {
		try {
			const checkIn = await this.checkInRepository.findCheckInById(id);
			if (!checkIn) {
				throw new NotFoundException(`Ingreso con ID ${id} no encontrado`);
			}
			return checkIn;
		} catch (error: any) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new HttpException(
				`Error al obtener el ingreso: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getClientCheckIns(
		ci: string,
		page: number = 1,
		limit: number = 10,
	) {
		try {
			// Validar que el cliente existe
			const client = await this.clientsService.findByCI(ci);
			if (!client) {
				throw new NotFoundException(`Cliente con CI ${ci} no encontrado`);
			}

			const offset = (page - 1) * limit;

			const [data, total] = await Promise.all([
				this.checkInRepository.getCheckInsByCI(
					ci,
					offset,
					limit,
				),
				this.checkInRepository.getCheckInsCountByCI(ci),
			]);

			return {
				data,
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
				client: {
					id: client._id,
					email: client.email,
					name: client.userInfo?.name,
					ci: client.userInfo?.CI,
					totalDays: client.totalDays || 0,
					lastCheckIn: client.lastCheckIn,
				},
			};
		} catch (error: any) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new HttpException(
				`Error al obtener los ingresos del cliente: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getClientStats(ci: string) {
		try {
			// Validar que el cliente existe
			const client = await this.clientsService.findByCI(ci);
			if (!client) {
				throw new NotFoundException(`Cliente con CI ${ci} no encontrado`);
			}

			const [lastCheckIn, totalCheckIns] = await Promise.all([
				this.checkInRepository.getLastCheckInByCI(ci),
				this.checkInRepository.getCheckInsCountByCI(ci),
			]);

			return {
				client: {
					id: client._id,
					email: client.email,
					name: client.userInfo?.name,
					CI: client.userInfo?.CI,
				},
				stats: {
					totalDays: client.totalDays || 0,
					totalCheckIns,
					lastCheckIn: client.lastCheckIn,
					lastCheckInRecord: lastCheckIn,
				},
			};
		} catch (error: any) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new HttpException(
				`Error al obtener las estadísticas del cliente: ${error.message}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
import {
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	NotFoundException,
	BadRequestException,
} from "@nestjs/common";
import { Types } from "mongoose";
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
		checkIn: CheckIn;
		client: any;
		message: string;
	}> {
		try {
			// 1. Validar que el cliente existe y está activo
			const client = await this.clientsService.findOne(
				createCheckInDto.clientId.toString(),
			);

			if (!client) {
				throw new NotFoundException(
					`Cliente con ID ${createCheckInDto.clientId} no encontrado`,
				);
			}

			if (client.disabled) {
				throw new BadRequestException(
					"El cliente está deshabilitado y no puede ingresar",
				);
			}

			// 2. Verificar si ya tiene un check-in hoy
			const todayCheckIn = await this.checkInRepository.getTodayCheckInByClientId(
				createCheckInDto.clientId,
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
			const updatedClient = await this.clientsService.update(
				client._id.toString(),
				{
					totalDays: (client.totalDays || 0) + 1,
					lastCheckIn: checkIn.checkInDate,
				} as any,
			);

			return {
				checkIn,
				client: updatedClient,
				message: "Ingreso registrado exitosamente",
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
			const { page = 1, limit = 10, clientId, startDate, endDate, organizationId } = getCheckInsDto;
			const offset = (page - 1) * limit;

			const filters: CheckInFilters = {};

			if (clientId) {
				filters.clientId = clientId;
			}

			if (startDate) {
				filters.startDate = new Date(startDate);
			}

			if (endDate) {
				filters.endDate = new Date(endDate);
			}

			if (organizationId) {
				filters.organizationId = organizationId;
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
		clientId: string,
		page: number = 1,
		limit: number = 10,
	) {
		try {
			// Validar que el cliente existe
			const client = await this.clientsService.findOne(clientId);
			if (!client) {
				throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
			}

			const offset = (page - 1) * limit;
			const clientObjectId = new Types.ObjectId(clientId);

			const [data, total] = await Promise.all([
				this.checkInRepository.getCheckInsByClientId(
					clientObjectId,
					offset,
					limit,
				),
				this.checkInRepository.getCheckInsCountByClientId(clientObjectId),
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

	async getClientStats(clientId: string) {
		try {
			// Validar que el cliente existe
			const client = await this.clientsService.findOne(clientId);
			if (!client) {
				throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
			}

			const clientObjectId = new Types.ObjectId(clientId);

			const [lastCheckIn, totalCheckIns] = await Promise.all([
				this.checkInRepository.getLastCheckInByClientId(clientObjectId),
				this.checkInRepository.getCheckInsCountByClientId(clientObjectId),
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
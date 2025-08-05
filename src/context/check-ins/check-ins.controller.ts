import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	HttpCode,
	HttpStatus,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
} from "@nestjs/swagger";
import { CheckInsService } from "@/src/context/check-ins/check-ins.service";
import { CreateCheckInDto } from "@/src/context/check-ins/dto/create-check-in.dto";
import { GetCheckInsDto } from "@/src/context/check-ins/dto/get-check-ins.dto";

@ApiTags("Check-ins")
@Controller("check-ins")
export class CheckInsController {
	constructor(private readonly checkInsService: CheckInsService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: "Registrar un nuevo ingreso",
		description: "Registra el ingreso de un cliente al gimnasio, incrementa sus días totales y actualiza su último ingreso",
	})
	@ApiResponse({
		status: 201,
		description: "Ingreso registrado exitosamente",
		schema: {
			type: "string",
			example: "Bienvenido Juan Pérez",
		},
	})
	@ApiResponse({
		status: 400,
		description: "Cliente deshabilitado o ya registró ingreso hoy",
	})
	@ApiResponse({
		status: 404,
		description: "Cliente no encontrado",
	})
	async create(@Body() createCheckInDto: CreateCheckInDto) {
		const result = await this.checkInsService.createCheckIn(createCheckInDto);
		return result.message;
	}

	@Get()
	@ApiOperation({
		summary: "Obtener historial de ingresos",
		description: "Obtiene una lista paginada de todos los ingresos con filtros opcionales",
	})
	@ApiResponse({
		status: 200,
		description: "Lista de ingresos obtenida exitosamente",
		schema: {
			type: "object",
			properties: {
				data: {
					type: "array",
					items: { type: "object" },
					description: "Lista de ingresos",
				},
				total: {
					type: "number",
					description: "Total de registros",
				},
				page: {
					type: "number",
					description: "Página actual",
				},
				limit: {
					type: "number",
					description: "Elementos por página",
				},
				totalPages: {
					type: "number",
					description: "Total de páginas",
				},
			},
		},
	})
	findAll(@Query() getCheckInsDto: GetCheckInsDto) {
		return this.checkInsService.findAll(getCheckInsDto);
	}

	@Get(":id")
	@ApiOperation({
		summary: "Obtener un ingreso por ID",
		description: "Obtiene los detalles de un ingreso específico",
	})
	@ApiParam({
		name: "id",
		description: "ID del ingreso",
		example: "507f1f77bcf86cd799439011",
	})
	@ApiResponse({
		status: 200,
		description: "Ingreso encontrado",
	})
	@ApiResponse({
		status: 404,
		description: "Ingreso no encontrado",
	})
	findOne(@Param("id") id: string) {
		return this.checkInsService.findOne(id);
	}

	@Get("client/:ci")
	@ApiOperation({
		summary: "Obtener ingresos de un cliente",
		description: "Obtiene el historial de ingresos de un cliente específico por su cédula",
	})
	@ApiParam({
		name: "ci",
		description: "Cédula de identidad del cliente (8 a 9 dígitos)",
		example: "12345678",
	})
	@ApiQuery({
		name: "page",
		required: false,
		description: "Número de página",
		example: 1,
	})
	@ApiQuery({
		name: "limit",
		required: false,
		description: "Elementos por página",
		example: 10,
	})
	@ApiResponse({
		status: 200,
		description: "Historial de ingresos del cliente",
	})
	@ApiResponse({
		status: 404,
		description: "Cliente no encontrado",
	})
	getClientCheckIns(
		@Param("ci") ci: string,
		@Query("page") page?: number,
		@Query("limit") limit?: number,
	) {
		return this.checkInsService.getClientCheckIns(
			ci,
			page ? Number(page) : 1,
			limit ? Number(limit) : 10,
		);
	}

	@Get("client/:ci/stats")
	@ApiOperation({
		summary: "Obtener estadísticas de un cliente",
		description: "Obtiene las estadísticas de asistencia de un cliente por su cédula (días totales, último ingreso, etc.)",
	})
	@ApiParam({
		name: "ci",
		description: "Cédula de identidad del cliente (8 a 9 dígitos)",
		example: "12345678",
	})
	@ApiResponse({
		status: 200,
		description: "Estadísticas del cliente",
		schema: {
			type: "object",
			properties: {
				client: {
					type: "object",
					description: "Información básica del cliente",
				},
				stats: {
					type: "object",
					properties: {
						totalDays: {
							type: "number",
							description: "Total de días de asistencia",
						},
						totalCheckIns: {
							type: "number",
							description: "Total de ingresos registrados",
						},
						lastCheckIn: {
							type: "string",
							format: "date-time",
							description: "Fecha del último ingreso",
						},
					},
				},
			},
		},
	})
	@ApiResponse({
		status: 404,
		description: "Cliente no encontrado",
	})
	getClientStats(@Param("ci") ci: string) {
		return this.checkInsService.getClientStats(ci);
	}
}
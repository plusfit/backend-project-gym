import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Role } from '@/src/context/shared/constants/roles.constant';
import { Roles } from '@/src/context/shared/guards/roles/roles.decorator';
import { RolesGuard } from '@/src/context/shared/guards/roles/roles.guard';

import { CreateCanjeDto } from './dto/create-canje.dto';
import { CreatePremioDto } from './dto/create-premio.dto';
import { GetCanjesDto } from './dto/get-canjes.dto';
import { GetPremiosDto } from './dto/get-premios.dto';
import { UpdatePremioDto } from './dto/update-premio.dto';
import { PremiosService } from './premios.service';


@ApiTags('premios')
@Controller('premios')
export class PremiosController {
  constructor(
    private readonly premiosService: PremiosService,
  ) {}

  // ========== RUTAS ADMINISTRATIVAS ==========

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Crear un nuevo premio' })
  @ApiResponse({ status: 201, description: 'Premio creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o premio duplicado' })
  async create(@Body() createPremioDto: CreatePremioDto) {
    const premio = await this.premiosService.createPremio(createPremioDto);
    
    return {
      success: true,
      message: 'Premio creado exitosamente',
      data: premio,
    };
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener todos los premios con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de premios' })
  async findAll(@Query() queryDto: GetPremiosDto) {
    const result = await this.premiosService.findAllPremios(queryDto);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Obtener catálogo público de premios habilitados' })
  @ApiResponse({ status: 200, description: 'Lista de premios disponibles para canje' })
  async getCatalog() {
    const premios = await this.premiosService.findEnabledPremios();
    return {
      success: true,
      data: premios,
    };
  }

  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener un premio específico por ID' })
  @ApiResponse({ status: 200, description: 'Premio encontrado' })
  @ApiResponse({ status: 404, description: 'Premio no encontrado' })
  async findOne(@Param('id') id: string) {
    const premio = await this.premiosService.findPremioById(id);
    return {
      success: true,
      data: premio,
    };
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar un premio' })
  @ApiResponse({ status: 200, description: 'Premio actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Premio no encontrado' })
  async update(@Param('id') id: string, @Body() updatePremioDto: UpdatePremioDto) {
    const premio = await this.premiosService.updatePremio(id, updatePremioDto);
    
    return {
      success: true,
      message: 'Premio actualizado exitosamente',
      data: premio,
    };
  }

  @Patch(':id/toggle-enabled')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Habilitar/deshabilitar un premio' })
  @ApiResponse({ status: 200, description: 'Estado del premio actualizado' })
  @ApiResponse({ status: 404, description: 'Premio no encontrado' })
  async toggleEnabled(@Param('id') id: string) {
    const premio = await this.premiosService.togglePremioEnabled(id);
    return {
      success: true,
      message: `Premio ${premio.enabled ? 'habilitado' : 'deshabilitado'} exitosamente`,
      data: premio,
    };
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Eliminar un premio' })
  @ApiResponse({ status: 200, description: 'Premio eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Premio no encontrado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar premio con canjes asociados' })
  async remove(@Param('id') id: string) {
    await this.premiosService.deletePremio(id);
    return {
      success: true,
      message: 'Premio eliminado exitosamente',
    };
  }

  // ========== RUTAS DE CANJES ==========

  @Post('canje')
  @ApiOperation({ summary: 'Realizar canje de premio' })
  @ApiResponse({ status: 201, description: 'Canje realizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en el canje (puntos insuficientes, premio no disponible, etc.)' })
  async realizarCanje(@Body() createCanjeDto: CreateCanjeDto) {
    const result = await this.premiosService.realizarCanje(createCanjeDto);
    
    return {
      success: result.success,
      message: result.message,
      data: result.success ? {
        canje: result.canje,
        puntosRestantes: result.puntosRestantes,
      } : null,
    };
  }

  @Get('canjes/historial')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener historial de canjes con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de canjes' })
  async getHistorialCanjes(@Query() queryDto: GetCanjesDto) {
    const result = await this.premiosService.findAllCanjes(queryDto);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('canjes/:id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener un canje específico por ID' })
  @ApiResponse({ status: 200, description: 'Canje encontrado' })
  @ApiResponse({ status: 404, description: 'Canje no encontrado' })
  async findCanje(@Param('id') id: string) {
    const canje = await this.premiosService.findCanjeById(id);
    return {
      success: true,
      data: canje,
    };
  }

  @Get('canjes/cliente/:clienteId')
  @ApiOperation({ summary: 'Obtener canjes de un cliente específico' })
  @ApiResponse({ status: 200, description: 'Lista de canjes del cliente' })
  async getCanjesCliente(@Param('clienteId') clienteId: string) {
    const canjes = await this.premiosService.findCanjesByClienteId(clienteId);
    return {
      success: true,
      data: canjes,
    };
  }
}
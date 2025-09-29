import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Role } from '@/src/context/shared/constants/roles.constant';
import { Roles } from '@/src/context/shared/guards/roles/roles.decorator';
import { RolesGuard } from '@/src/context/shared/guards/roles/roles.guard';

import { CreateExchangeDto } from './dto/create-exchange.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { GetExchangesDto } from './dto/get-exchanges.dto';
import { GetRewardsDto } from './dto/get-rewards.dto';
import { UpdateExchangeStatusDto } from './dto/update-exchange-status.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardsService } from './rewards.service';


@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
  ) {}

  // ========== RUTAS ADMINISTRATIVAS ==========

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Crear un nuevo premio' })
  @ApiResponse({ status: 201, description: 'Premio creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o premio duplicado' })
  async create(@Body() createRewardDto: CreateRewardDto) {
    const reward = await this.rewardsService.createReward(createRewardDto);
    
    return {
      success: true,
      message: 'Reward created successfully',
      data: reward,
    };
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener todos los premios con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de premios' })
  async findAll(@Query() queryDto: GetRewardsDto) {
    const result = await this.rewardsService.findAllRewards(queryDto);
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
    const rewards = await this.rewardsService.findEnabledRewards();
    return {
      success: true,
      data: rewards,
    };
  }

  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener un premio específico por ID' })
  @ApiResponse({ status: 200, description: 'Premio encontrado' })
  @ApiResponse({ status: 404, description: 'Premio no encontrado' })
  async findOne(@Param('id') id: string) {
    const reward = await this.rewardsService.findRewardById(id);
    return {
      success: true,
      data: reward,
    };
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar un premio' })
  @ApiResponse({ status: 200, description: 'Premio actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Premio no encontrado' })
  async update(@Param('id') id: string, @Body() updateRewardDto: UpdateRewardDto) {
    const reward = await this.rewardsService.updateReward(id, updateRewardDto);
    
    return {
      success: true,
      message: 'Reward updated successfully',
      data: reward,
    };
  }

  @Patch(':id/toggle-enabled')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Habilitar/deshabilitar un premio' })
  @ApiResponse({ status: 200, description: 'Estado del premio actualizado' })
  @ApiResponse({ status: 404, description: 'Premio no encontrado' })
  async toggleEnabled(@Param('id') id: string) {
    const reward = await this.rewardsService.toggleRewardEnabled(id);
    return {
      success: true,
      message: `Reward ${reward.enabled ? 'enabled' : 'disabled'} successfully`,
      data: reward,
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
    await this.rewardsService.deleteReward(id);
    return {
      success: true,
      message: 'Reward deleted successfully',
    };
  }

  // ========== RUTAS DE CANJES ==========

  @Post('exchange')
  @ApiOperation({ summary: 'Realizar canje de premio' })
  @ApiResponse({ status: 201, description: 'Canje realizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error en el canje (puntos insuficientes, premio no disponible, etc.)' })
  async realizarExchange(@Body() createExchangeDto: CreateExchangeDto) {
    const result = await this.rewardsService.performExchange(createExchangeDto);
    
    return {
      success: result.success,
      message: result.message,
      data: result.success ? {
        exchange: result.exchange,
        remainingPoints: result.remainingPoints,
      } : null,
    };
  }

  @Get('exchanges/history')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener historial de canjes con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de canjes' })
  async getHistorialExchanges(@Query() queryDto: GetExchangesDto) {
    const result = await this.rewardsService.findAllExchanges(queryDto);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('exchanges/:id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener un canje específico por ID' })
  @ApiResponse({ status: 200, description: 'Canje encontrado' })
  @ApiResponse({ status: 404, description: 'Canje no encontrado' })
  async findExchange(@Param('id') id: string) {
    const exchange = await this.rewardsService.findExchangeById(id);
    return {
      success: true,
      data: exchange,
    };
  }

  @Patch('exchanges/:exchangeId/status')
  @ApiOperation({ summary: 'Actualizar estado de un canje' })
  @ApiResponse({ status: 200, description: 'Estado del canje actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Canje no encontrado' })
  @ApiResponse({ status: 400, description: 'Error al actualizar el estado del canje' })
  async updateExchangeStatus(
    @Param('exchangeId') exchangeId: string,
    @Body() updateExchangeStatusDto: UpdateExchangeStatusDto,
  ) {
    const exchange = await this.rewardsService.updateExchangeStatus(exchangeId, updateExchangeStatusDto);
    
    return {
      success: true,
      message: `Estado del canje actualizado a ${updateExchangeStatusDto.status}`,
      data: exchange,
    };
  }

  @Get('exchanges/client/:clienteId')
  @ApiOperation({ summary: 'Obtener canjes de un cliente específico' })
  @ApiResponse({ status: 200, description: 'Lista de canjes del cliente' })
  async getExchangesClient(@Param('clienteId') clienteId: string) {
    const exchanges = await this.rewardsService.findExchangesByClientId(clienteId);
    return {
      success: true,
      data: exchanges,
    };
  }
}
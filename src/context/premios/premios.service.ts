import { BadRequestException, Injectable, Logger,NotFoundException } from '@nestjs/common';

import { ClientsService } from '../clients/clients.service';
import { CreateCanjeDto } from './dto/create-canje.dto';
import { CreatePremioDto } from './dto/create-premio.dto';
import { GetCanjesDto } from './dto/get-canjes.dto';
import { GetPremiosDto } from './dto/get-premios.dto';
import { UpdatePremioDto } from './dto/update-premio.dto';
import { Canje, CanjeResponse, CanjeResult } from './entities/canje.entity';
import { Premio, PremioResponse } from './entities/premio.entity';
import { CanjeRepository } from './repositories/canje.repository';
import { PremioRepository } from './repositories/premio.repository';

@Injectable()
export class PremiosService {
  private readonly logger = new Logger(PremiosService.name);

  constructor(
    private readonly premioRepository: PremioRepository,
    private readonly canjeRepository: CanjeRepository,
    private readonly clientsService: ClientsService,
  ) {}

  // ========== GESTIÓN DE PREMIOS ==========

  async createPremio(createPremioDto: CreatePremioDto): Promise<Premio> {
    this.logger.log(`Creating premio: ${createPremioDto.name}`);

    // Verificar que no exista un premio con el mismo nombre
    const existingPremio = await this.premioRepository.findByName(createPremioDto.name);
    if (existingPremio) {
      throw new BadRequestException('Ya existe un premio con ese nombre');
    }

    const premio = await this.premioRepository.create({
      ...createPremioDto,
      enabled: createPremioDto.enabled ?? false,
      totalCanjes: 0,
    });

    this.logger.log(`Premio created successfully: ${premio.id}`);
    return premio;
  }

  async findAllPremios(queryDto: GetPremiosDto): Promise<PremioResponse> {
    this.logger.log('Finding all premios with filters', queryDto);
    return await this.premioRepository.findAll(queryDto);
  }

  async findPremioById(id: string): Promise<Premio> {
    this.logger.log(`Finding premio by id: ${id}`);
    const premio = await this.premioRepository.findById(id);
    if (!premio) {
      throw new NotFoundException('Premio no encontrado');
    }
    return premio;
  }

  async findEnabledPremios(): Promise<Premio[]> {
    this.logger.log('Finding enabled premios for catalog');
    return await this.premioRepository.findEnabled();
  }

  async updatePremio(id: string, updatePremioDto: UpdatePremioDto): Promise<Premio> {
    this.logger.log(`Updating premio: ${id}`);

    const existingPremio = await this.premioRepository.findById(id);
    if (!existingPremio) {
      throw new NotFoundException('Premio no encontrado');
    }

    // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
    if (updatePremioDto.name && updatePremioDto.name !== existingPremio.name) {
      const duplicatePremio = await this.premioRepository.findByName(updatePremioDto.name);
      if (duplicatePremio) {
        throw new BadRequestException('Ya existe un premio con ese nombre');
      }
    }

    const updatedPremio = await this.premioRepository.update(id, updatePremioDto);
    if (!updatedPremio) {
      throw new NotFoundException('Premio no encontrado');
    }

    this.logger.log(`Premio updated successfully: ${id}`);
    return updatedPremio;
  }

  async togglePremioEnabled(id: string): Promise<Premio> {
    this.logger.log(`Toggling premio enabled status: ${id}`);
    const premio = await this.premioRepository.toggleEnabled(id);
    if (!premio) {
      throw new NotFoundException('Premio no encontrado');
    }
    this.logger.log(`Premio status toggled: ${id} - enabled: ${premio.enabled}`);
    return premio;
  }

  async deletePremio(id: string): Promise<void> {
    this.logger.log(`Deleting premio: ${id}`);

    const existingPremio = await this.premioRepository.findById(id);
    if (!existingPremio) {
      throw new NotFoundException('Premio no encontrado');
    }

    // Verificar si el premio tiene canjes asociados
    const canjesCount = await this.canjeRepository.countByPremioId(id);
    if (canjesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el premio porque tiene canjes asociados. Considere deshabilitarlo en su lugar.'
      );
    }

    const deleted = await this.premioRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Premio no encontrado');
    }

    this.logger.log(`Premio deleted successfully: ${id}`);
  }

  // ========== GESTIÓN DE CANJES ==========

  async realizarCanje(createCanjeDto: CreateCanjeDto): Promise<CanjeResult> {
    this.logger.log('Processing canje request', createCanjeDto);

    try {
      // Verificar que el premio existe y está habilitado
      const premio = await this.premioRepository.findById(createCanjeDto.premioId);
      if (!premio) {
        return {
          success: false,
          message: 'Premio no encontrado',
        };
      }

      if (!premio.enabled) {
        return {
          success: false,
          message: 'Premio no disponible para canje',
        };
      }

      // Verificar que el cliente existe y tiene puntos suficientes
      const cliente = await this.clientsService.findOne(createCanjeDto.clienteId);
      if (!cliente) {
        return {
          success: false,
          message: 'Cliente no encontrado',
        };
      }

      // Verificar puntos disponibles (asumiendo que el cliente tiene un campo availablePoints)
      const availablePoints = cliente.availablePoints || 0;
      if (availablePoints < premio.pointsRequired) {
        return {
          success: false,
          message: `Puntos insuficientes. Necesitas ${premio.pointsRequired} puntos, tienes ${availablePoints}`,
        };
      }

      // Obtener información del admin si se proporciona
      let adminName: string | undefined;
      if (createCanjeDto.adminId) {
        // Aquí deberías obtener la información del admin
        // adminName = await this.getAdminName(createCanjeDto.adminId);
        adminName = 'Administrador'; // Placeholder
      }

      // Crear el canje
      const canje = await this.canjeRepository.create({
        premioId: premio.id,
        premioName: premio.name,
        clienteId: cliente.id,
        clienteName: cliente.name,
        clienteEmail: cliente.email,
        adminId: createCanjeDto.adminId,
        adminName,
        pointsUsed: premio.pointsRequired,
        canjeDate: new Date(),
        status: 'completed',
      });

      // Actualizar puntos del cliente
      const newAvailablePoints = availablePoints - premio.pointsRequired;
      await this.clientsService.updatePoints(cliente.id, newAvailablePoints);

      // Incrementar contador de canjes del premio
      await this.premioRepository.incrementCanjes(premio.id);

      this.logger.log(`Canje completed successfully: ${canje.id}`);

      return {
        success: true,
        message: 'Canje realizado exitosamente',
        puntosRestantes: newAvailablePoints,
        canje,
      };
    } catch (error) {
      this.logger.error('Error processing canje', error);
      return {
        success: false,
        message: 'Error interno del sistema',
      };
    }
  }

  async findAllCanjes(queryDto: GetCanjesDto): Promise<CanjeResponse> {
    this.logger.log('Finding all canjes with filters', queryDto);
    return await this.canjeRepository.findAll(queryDto);
  }

  async findCanjeById(id: string): Promise<Canje> {
    this.logger.log(`Finding canje by id: ${id}`);
    const canje = await this.canjeRepository.findById(id);
    if (!canje) {
      throw new NotFoundException('Canje no encontrado');
    }
    return canje;
  }

  async findCanjesByClienteId(clienteId: string): Promise<Canje[]> {
    this.logger.log(`Finding canjes for cliente: ${clienteId}`);
    return await this.canjeRepository.findByClienteId(clienteId);
  }
}
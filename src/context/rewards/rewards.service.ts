import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ExchangeStatus } from '@/src/context/shared/enums/exchange-status.enum';

import { ClientsService } from '../clients/clients.service';
import { Client } from '../clients/schemas/client.schema';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { GetExchangesDto } from './dto/get-exchanges.dto';
import { GetRewardsDto } from './dto/get-rewards.dto';
import { UpdateExchangeStatusDto } from './dto/update-exchange-status.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { Exchange, ExchangeResponse, ExchangeResult } from './entities/exchange.entity';
import { Reward, RewardResponse } from './entities/reward.entity';
import { ExchangeRepository } from './repositories/exchange.repository';
import { RewardRepository } from './repositories/reward.repository';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly rewardRepository: RewardRepository,
    private readonly exchangeRepository: ExchangeRepository,
    private readonly clientsService: ClientsService,
  ) {}

  // ========== REWARD MANAGEMENT ==========

  async createReward(createRewardDto: CreateRewardDto): Promise<Reward> {
    this.logger.log(`Creating reward: ${createRewardDto.name}`);

    // Verify that a reward with the same name doesn't exist
    const existingReward = await this.rewardRepository.findByName(createRewardDto.name);
    if (existingReward) {
      throw new BadRequestException('Ya existe un premio con ese nombre');
    }

    const reward = await this.rewardRepository.create({
      ...createRewardDto,
      disabled: createRewardDto.disabled ?? false,
      totalExchanges: 0,
    });

    this.logger.log(`Reward created successfully: ${reward.id}`);
    return reward;
  }

  async findAllRewards(queryDto: GetRewardsDto): Promise<RewardResponse> {
    this.logger.log('Finding all rewards with filters', queryDto);
    return await this.rewardRepository.findAll(queryDto);
  }

  async findRewardById(id: string): Promise<Reward> {
    this.logger.log(`Finding reward by id: ${id}`);
    const reward = await this.rewardRepository.findById(id);
    if (!reward) {
      throw new NotFoundException('Premio no encontrado');
    }
    return reward;
  }

  async findNotDisabledRewards(): Promise<Reward[]> {
    this.logger.log('Finding not disabled rewards for catalog');
    return await this.rewardRepository.findNotDisabled();
  }

  async updateReward(id: string, updateRewardDto: UpdateRewardDto): Promise<Reward> {
    this.logger.log(`Updating reward: ${id}`);

    const existingReward = await this.rewardRepository.findById(id);
    if (!existingReward) {
      throw new NotFoundException('Premio no encontrado');
    }

    // If updating the name, verify that another reward with the same name doesn't exist
    if (updateRewardDto.name && updateRewardDto.name !== existingReward.name) {
      const duplicateReward = await this.rewardRepository.findByName(updateRewardDto.name);
      if (duplicateReward) {
        throw new BadRequestException('Ya existe un premio con ese nombre');
      }
    }

    const updatedReward = await this.rewardRepository.update(id, updateRewardDto);
    if (!updatedReward) {
      throw new NotFoundException('Premio no encontrado');
    }

    this.logger.log(`Reward updated successfully: ${id}`);
    return updatedReward;
  }

  async toggleRewardDisabled(id: string): Promise<Reward> {
    this.logger.log(`Toggling reward disabled status: ${id}`);
    const reward = await this.rewardRepository.toggleDisabled(id);
    if (!reward) {
      throw new NotFoundException('Premio no encontrado');
    }
    this.logger.log(`Reward status toggled: ${id} - disabled: ${reward.disabled}`);
    return reward;
  }

  async deleteReward(id: string): Promise<void> {
    this.logger.log(`Deleting reward: ${id}`);

    const existingReward = await this.rewardRepository.findById(id);
    if (!existingReward) {
      throw new NotFoundException('Premio no encontrado');
    }

    // Verify if the reward has associated exchanges
    const exchangesCount = await this.exchangeRepository.countByRewardId(id);
    if (exchangesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el premio porque tiene canjes asociados. Considera deshabilitarlo en su lugar.'
      );
    }

    const deleted = await this.rewardRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Premio no encontrado');
    }

    this.logger.log(`Reward deleted successfully: ${id}`);
  }

  // ========== EXCHANGE MANAGEMENT ==========

  async performExchange(createExchangeDto: CreateExchangeDto): Promise<ExchangeResult> {
    this.logger.log('Processing exchange request', createExchangeDto);

    try {
      const reward = await this.rewardRepository.findById(createExchangeDto.rewardId);
      if (!reward) {
        return {
          success: false,
          message: 'Premio no encontrado',
        };
      }

      if (reward.disabled) {
        return {
          success: false,
          message: 'Premio no disponible para canje',
        };
      }

      const client: Client = await this.clientsService.findOne(createExchangeDto.clientId);
      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }

      const availablePoints = client.availablePoints || 0;
      if (availablePoints < reward.pointsRequired) {
        return {
          success: false,
          message: `Puntos insuficientes. Necesitas ${reward.pointsRequired} puntos, tienes ${availablePoints}`,
        };
      }

      let adminName: string | undefined;
      // TODO: Review if this is necessary
      if (createExchangeDto.adminId) {
        // Here you should get the admin information
        // adminName = await this.getAdminName(createExchangeDto.adminId);
        adminName = 'Administrator'; // Placeholder
      }
      
      const exchange = await this.exchangeRepository.create({
        rewardId: reward.id,
        rewardName: reward.name,
        rewardImageUrl: reward.imageUrl,
        rewardImagePath: reward.imagePath,
        rewardMediaType: reward.mediaType,
        clientId: client.id,
        clientName: client.userInfo?.name || client.email || 'Cliente',
        clientEmail: client.email,
        adminId: createExchangeDto.adminId,
        adminName,
        pointsUsed: reward.pointsRequired,
        exchangeDate: new Date(),
        status: ExchangeStatus.PENDING,
      });

      const newAvailablePoints = availablePoints;

      // Increment exchange counter for the reward
      await this.rewardRepository.incrementExchanges(reward.id);

      this.logger.log(`Exchange completed successfully: ${exchange.id}`);

      return {
        success: true,
        message: 'Canje completado exitosamente',
        remainingPoints: newAvailablePoints,
        exchange,
      };
    } catch (error: any) {
      this.logger.error('Error processing exchange', error);
      this.logger.error('Error details:', error instanceof Error ? error.message : String(error));
      this.logger.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Error processing exchange: ${error.message}`)
    }
  }

  async findAllExchanges(queryDto: GetExchangesDto): Promise<ExchangeResponse> {
    this.logger.log('Finding all exchanges with filters', queryDto);
    return await this.exchangeRepository.findAll(queryDto);
  }

  async findExchangeById(id: string): Promise<Exchange> {
    this.logger.log(`Finding exchange by id: ${id}`);
    const exchange = await this.exchangeRepository.findById(id);
    if (!exchange) {
      throw new NotFoundException('Canje no encontrado');
    }
    return exchange;
  }

  async findExchangesByClientId(clientId: string): Promise<Exchange[]> {
    this.logger.log(`Finding exchanges for client: ${clientId}`);
    return await this.exchangeRepository.findByClientId(clientId);
  }

  async findByRequiredDays(consecutiveDays: number): Promise<Reward | null> {
    this.logger.log(`Finding reward by required days: ${consecutiveDays}`);
    
    // Since the current reward schema uses pointsRequired instead of requiredDays,
    // we'll need to find a reward that matches this criteria
    // For now, we'll assume that consecutive days can be mapped to points
    // This might need to be adjusted based on business logic
    const rewards = await this.rewardRepository.findAll({ 
      page: 1, 
      limit: 100, 
      disabled: false 
    });
    
    // Find a reward where the pointsRequired matches or is close to the consecutive days
    // This is a placeholder logic that might need adjustment
    const matchingReward = rewards.data.find(reward => reward.pointsRequired === consecutiveDays);
    
    return matchingReward || null;
  }

  // ========== EXCHANGE STATUS MANAGEMENT ==========

  async updateExchangeStatus(exchangeId: string, updateExchangeStatusDto: UpdateExchangeStatusDto): Promise<Exchange> {
    this.logger.log(`Updating exchange status for exchange: ${exchangeId}`);

    // Verify that the exchange exists
    const existingExchange = await this.exchangeRepository.findById(exchangeId);
    if (!existingExchange) {
      this.logger.error(`Exchange not found: ${exchangeId}`);
      throw new NotFoundException('Canje no encontrado');
    }

    // Log the current and new status for auditing
    this.logger.log(`Changing exchange ${exchangeId} status from ${existingExchange.status} to ${updateExchangeStatusDto.status}`);

    // Update the exchange status
    const updatedExchange = await this.exchangeRepository.update(exchangeId, {
      status: updateExchangeStatusDto.status,
    });

    if (!updatedExchange) {
      this.logger.error(`Failed to update exchange status: ${exchangeId}`);
      throw new BadRequestException('Error al actualizar el estado del canje');
    }

    this.logger.log(`Exchange status updated successfully: ${exchangeId}`);
    return updatedExchange;
  }
}
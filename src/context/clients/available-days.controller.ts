import { Controller, Post, Get, Param, Body, HttpStatus, Put, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { DailyDecrementService } from './services/daily-decrement.service';
import { ClientsService } from './clients.service';
import { AddAvailableDaysDto, UpdateAvailableDaysDto } from './dto/available-days.dto';

@ApiTags('Available Days Management')
@ApiBearerAuth()
@Controller('clients/available-days')
export class AvailableDaysController {
	constructor(
		private readonly dailyDecrementService: DailyDecrementService,
		private readonly clientsService: ClientsService,
	) {}

	@Post(':clientId/add')
	@ApiOperation({ 
		summary: 'Add days to existing available days',
		description: 'Adds days to the current available days count for a client.'
	})
	@ApiParam({ name: 'clientId', description: 'Client ID to update' })
	@ApiBody({ type: AddAvailableDaysDto })
	async addAvailableDays(
		@Param('clientId') clientId: string,
		@Body() addDto: AddAvailableDaysDto
	) {
		return this.clientsService.addAvailableDays(clientId, addDto.daysToAdd);
	}

	@Get(':clientId')
	@ApiOperation({ 
		summary: 'Get available days for a specific client',
		description: 'Returns the current number of available days for a client.'
	})
	@ApiParam({ name: 'clientId', description: 'Client ID to query' })
	async getClientAvailableDays(@Param('clientId') clientId: string) {
		return this.clientsService.getClientAvailableDays(clientId);
	}

	@Patch(':clientId/update')
	@ApiOperation({ 
		summary: 'Update/correct available days for a client',
		description: 'Sets the exact number of available days for a client. Useful for correcting mistakes when the wrong amount was previously set.'
	})
	@ApiParam({ name: 'clientId', description: 'Client ID to update' })
	@ApiBody({ type: UpdateAvailableDaysDto })
	async updateAvailableDays(
		@Param('clientId') clientId: string,
		@Body() updateDto: UpdateAvailableDaysDto
	) {
		return this.clientsService.updateAvailableDays(clientId, updateDto.availableDays);
	}

	
	@Post('manual-decrement')
	@ApiOperation({ 
		summary: 'Manually trigger daily decrement',
		description: 'Manually decrements available days for all clients. Useful for testing or manual operations.'
	})
	async manualDecrement() {
		return this.dailyDecrementService.manualDecrement();
	}

	// @Post(':clientId/manual-decrement')
	// @ApiOperation({ 
	// 	summary: 'Manually decrement days for specific client',
	// 	description: 'Manually decrements available days for a specific client.'
	// })
	// @ApiParam({ name: 'clientId', description: 'Client ID to decrement' })
	// async manualDecrementClient(@Param('clientId') clientId: string) {
	// 	return this.dailyDecrementService.manualDecrement(clientId);
	// }
}
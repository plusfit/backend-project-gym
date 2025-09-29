import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { ExchangeStatus } from '@/src/context/shared/enums/exchange-status.enum';

export class GetExchangesDto {
  @ApiPropertyOptional({ 
    description: 'Start date to filter exchanges (ISO format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ 
    description: 'End date to filter exchanges (ISO format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ 
    description: 'Search by client name or reward',
    example: 'Juan Pérez'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by exchange status',
    enum: Object.values(ExchangeStatus),
    example: ExchangeStatus.COMPLETED
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ExchangeStatus))
  status?: ExchangeStatus;

  @ApiPropertyOptional({ 
    description: 'Page number',
    minimum: 1,
    default: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Items per page',
    minimum: 1,
    default: 10,
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
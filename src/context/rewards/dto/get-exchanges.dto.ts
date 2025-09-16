import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn,IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
    enum: ['completed', 'pending', 'cancelled'],
    example: 'completed'
  })
  @IsOptional()
  @IsString()
  @IsIn(['completed', 'pending', 'cancelled'])
  status?: 'completed' | 'pending' | 'cancelled';

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
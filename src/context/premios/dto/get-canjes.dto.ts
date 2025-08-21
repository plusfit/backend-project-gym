import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn,IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetCanjesDto {
  @ApiPropertyOptional({ 
    description: 'Fecha de inicio para filtrar canjes (ISO format)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha de fin para filtrar canjes (ISO format)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Búsqueda por nombre de cliente o premio',
    example: 'Juan Pérez'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por estado del canje',
    enum: ['completed', 'pending', 'cancelled'],
    example: 'completed'
  })
  @IsOptional()
  @IsString()
  @IsIn(['completed', 'pending', 'cancelled'])
  status?: 'completed' | 'pending' | 'cancelled';

  @ApiPropertyOptional({ 
    description: 'Número de página',
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
    description: 'Elementos por página',
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
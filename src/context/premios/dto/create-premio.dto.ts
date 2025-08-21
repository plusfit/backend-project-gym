import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePremioDto {
  @ApiProperty({ 
    description: 'Nombre del premio', 
    maxLength: 100,
    example: 'Botella de Agua Deportiva'
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ 
    description: 'Descripción del premio', 
    maxLength: 500,
    example: 'Botella reutilizable de 750ml con logo del gimnasio'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    description: 'Puntos requeridos para canjear el premio', 
    minimum: 1,
    example: 100
  })
  @IsNumber()
  @Min(1)
  pointsRequired!: number;

  @ApiPropertyOptional({ 
    description: 'Estado habilitado del premio', 
    default: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional,IsString } from 'class-validator';

export class CreateCanjeDto {
  @ApiProperty({ 
    description: 'ID del premio a canjear',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  premioId!: string;

  @ApiProperty({ 
    description: 'ID del cliente que realiza el canje',
    example: '507f1f77bcf86cd799439012'
  })
  @IsString()
  clienteId!: string;

  @ApiPropertyOptional({ 
    description: 'ID del administrador que gestiona el canje (opcional)',
    example: '507f1f77bcf86cd799439013'
  })
  @IsOptional()
  @IsString()
  adminId?: string;
}
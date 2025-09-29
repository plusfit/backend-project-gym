import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExchangeDto {
  @ApiProperty({
    description: 'ID of the reward to exchange',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsNotEmpty()
  rewardId!: string;

  @ApiProperty({
    description: 'ID of the client making the exchange',
    example: '507f1f77bcf86cd799439012'
  })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiPropertyOptional({ 
    description: 'ID of the administrator managing the exchange (optional)',
    example: '507f1f77bcf86cd799439013'
  })
  @IsOptional()
  @IsString()
  adminId?: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateExchangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del canje',
    enum: ['completed', 'pending', 'cancelled'],
    example: 'completed',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['completed', 'pending', 'cancelled'], {
    message: 'El estado debe ser uno de: completed, pending, cancelled',
  })
  status!: 'completed' | 'pending' | 'cancelled';
}

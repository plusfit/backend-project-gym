import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import { ExchangeStatus } from '@/src/context/shared/enums/exchange-status.enum';

export class UpdateExchangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del canje',
    enum: Object.values(ExchangeStatus),
    example: ExchangeStatus.COMPLETED,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(ExchangeStatus), {
    message: `El estado debe ser uno de: ${Object.values(ExchangeStatus).join(', ')}`,
  })
  status!: ExchangeStatus;
}

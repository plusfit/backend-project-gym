import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class UpdateAvailableDaysDto {
  @ApiProperty({
    description: 'Number of available days to set for the client',
    example: 30,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Available days cannot be negative' })
  availableDays!: number;
}

export class AddAvailableDaysDto {
  @ApiProperty({
    description: 'Number of days to add to current available days',
    example: 30,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive({ message: 'Days to add must be greater than 0' })
  daysToAdd!: number;
}
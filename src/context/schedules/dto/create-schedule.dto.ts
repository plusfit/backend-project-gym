import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, IsMongoId, IsString } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Hora de inicio del horario', example: '2024-09-02T08:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ description: 'Hora de finalización del horario', example: '2024-09-02T10:00:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ description: 'Cantidad máxima de clientes permitidos', example: 10 })
  @IsInt()
  maxCount!: number;

  @ApiProperty({ description: 'Lista de IDs de clientes', example: ['60c72b2f5f1b2c6d88f0e0c6'] })
  @IsArray()
  @IsMongoId({ each: true })
  clients!: string[];

  @ApiProperty({ description: 'Día de la semana para el horario', example: 'Monday' })
  @IsString()
  day!: string;
}

import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetPaymentsDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'La página debe ser un número' })
    @Min(1, { message: 'La página debe ser mayor a 0' })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El límite debe ser un número' })
    @Min(1, { message: 'El límite debe ser mayor a 0' })
    limit?: number = 10;

    @IsOptional()
    @IsString({ message: 'El ID del cliente debe ser una cadena de texto' })
    clientId?: string;

    @IsOptional()
    @IsString({ message: 'El nombre del cliente debe ser una cadena de texto' })
    clientName?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
    startDate?: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El amount mínimo debe ser un número' })
    minAmount?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'El amount máximo debe ser un número' })
    maxAmount?: number;
}
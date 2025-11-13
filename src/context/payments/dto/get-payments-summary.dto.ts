import { IsNotEmpty, IsDateString } from 'class-validator';

export class GetPaymentsSummaryDto {
    @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
    @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
    startDate!: string;

    @IsNotEmpty({ message: 'La fecha de fin es requerida' })
    @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' })
    endDate!: string;
}
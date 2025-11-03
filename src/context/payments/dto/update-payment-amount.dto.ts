import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePaymentAmountDto {
    @IsNotEmpty({ message: 'El amount es requerido' })
    @IsNumber({}, { message: 'El amount debe ser un número' })
    @IsPositive({ message: 'El amount debe ser positivo' })
    @Transform(({ value }) => parseFloat(value))
    amount!: number;
}
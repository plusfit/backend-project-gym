import { IsNotEmpty, IsNumber, IsString, IsPositive, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
    @IsNotEmpty({ message: 'El amount es requerido' })
    @IsNumber({}, { message: 'El amount debe ser un número' })
    @IsPositive({ message: 'El amount debe ser positivo' })
    @Transform(({ value }) => parseFloat(value))
    amount!: number;

    @IsNotEmpty({ message: 'El ID del cliente es requerido' })
    @IsString({ message: 'El ID del cliente debe ser una cadena de texto' })
    clientId!: string;

    @IsNotEmpty({ message: 'El nombre del cliente es requerido' })
    @IsString({ message: 'El nombre del cliente debe ser una cadena de texto' })
    clientName!: string;
}
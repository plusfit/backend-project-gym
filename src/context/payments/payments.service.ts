import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetPaymentsDto } from './dto/get-payments.dto';
import { Payment, PaymentFilters, PaymentStats } from './entities/payment.entity';
import { PaymentRepository } from './repositories/payment.repository';

interface PaginationResult<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(private readonly paymentRepository: PaymentRepository) { }

    async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
        try {

            const paymentData: Partial<Payment> = {
                amount: createPaymentDto.amount,
                clientId: createPaymentDto.clientId,
                clientName: createPaymentDto.clientName,
            };

            const payment = await this.paymentRepository.create(paymentData);

            return payment;
        } catch (error: any) {
            this.logger.error('Error creating payment', { error: error.message, createPaymentDto });
            throw new BadRequestException('Error al crear el pago: ' + error.message);
        }
    }

    async findAll(queryDto: GetPaymentsDto): Promise<PaginationResult<Payment>> {
        try {
            const { page = 1, limit = 10, ...filterOptions } = queryDto;

            const filters: PaymentFilters = {
                clientId: filterOptions.clientId,
                clientName: filterOptions.clientName,
                startDate: filterOptions.startDate,
                endDate: filterOptions.endDate,
                minAmount: filterOptions.minAmount,
                maxAmount: filterOptions.maxAmount,
            };

            const result = await this.paymentRepository.findAll(page, limit, filters);

            return {
                data: result.payments,
                pagination: this.createPaginationInfo(page, limit, result.total),
            };
        } catch (error: any) {
            throw new BadRequestException('Error al obtener los pagos: ' + error.message);
        }
    }

    async findById(id: string): Promise<Payment> {
        try {
            const payment = await this.paymentRepository.findById(id);

            if (!payment) {
                throw new NotFoundException('Pago no encontrado');
            }

            return payment;
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error al obtener el pago: ' + error.message);
        }
    }

    async delete(id: string): Promise<{ success: boolean }> {
        try {
            const deleted = await this.paymentRepository.delete(id);
            if (!deleted) {
                throw new NotFoundException('Pago no encontrado');
            }

            return { success: true };
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error al eliminar el pago: ' + error.message);
        }
    }

    async getStats(filters?: GetPaymentsDto): Promise<PaymentStats> {
        try {
            const paymentFilters: PaymentFilters = filters ? {
                clientId: filters.clientId,
                clientName: filters.clientName,
                startDate: filters.startDate,
                endDate: filters.endDate,
                minAmount: filters.minAmount,
                maxAmount: filters.maxAmount,
            } : {};

            return await this.paymentRepository.getStats(paymentFilters);
        } catch (error: any) {
            this.logger.error('Error getting payment stats', { error: error.message, filters });
            throw new BadRequestException('Error al obtener las estadísticas: ' + error.message);
        }
    }

    private createPaginationInfo(page: number, limit: number, total: number) {
        return {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            limit,
        };
    }
}
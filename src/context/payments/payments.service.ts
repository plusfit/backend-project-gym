import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetPaymentsDto } from './dto/get-payments.dto';
import { UpdatePaymentAmountDto } from './dto/update-payment-amount.dto';
import { GetPaymentsSummaryDto } from './dto/get-payments-summary.dto';
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

            // Validar que si se proporcionan ambas fechas, startDate no sea mayor que endDate
            if (filterOptions.startDate && filterOptions.endDate) {
                const startDate = new Date(filterOptions.startDate);
                const endDate = new Date(filterOptions.endDate);

                if (startDate > endDate) {
                    throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin');
                }
            }

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
            if (error instanceof BadRequestException) {
                throw error;
            }
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

    async updateAmount(id: string, updatePaymentAmountDto: UpdatePaymentAmountDto): Promise<Payment> {
        try {
            const updatedPayment = await this.paymentRepository.updateAmount(id, updatePaymentAmountDto.amount);

            if (!updatedPayment) {
                throw new NotFoundException('Pago no encontrado');
            }

            this.logger.log('Payment amount updated successfully', { id, newAmount: updatePaymentAmountDto.amount });
            return updatedPayment;
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error('Error updating payment amount', { error: error.message, id, updatePaymentAmountDto });
            throw new BadRequestException('Error al actualizar el monto del pago: ' + error.message);
        }
    }

    async getSummaryByDateRange(summaryDto: GetPaymentsSummaryDto): Promise<{
        totalAmount: number;
        count: number;
        dateRange: {
            startDate: string;
            endDate: string;
        };
    }> {
        try {
            // Validar que la fecha de inicio no sea mayor que la fecha de fin
            const startDate = new Date(summaryDto.startDate);
            const endDate = new Date(summaryDto.endDate);

            if (startDate > endDate) {
                throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin');
            }

            const summary = await this.paymentRepository.getSummaryByDateRange(
                summaryDto.startDate,
                summaryDto.endDate
            );

            this.logger.log('Payments summary calculated', {
                startDate: summaryDto.startDate,
                endDate: summaryDto.endDate,
                totalAmount: summary.totalAmount,
                count: summary.count
            });

            return {
                totalAmount: summary.totalAmount,
                count: summary.count,
                dateRange: {
                    startDate: summaryDto.startDate,
                    endDate: summaryDto.endDate
                }
            };
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error('Error getting payments summary by date range', {
                error: error.message,
                summaryDto
            });
            throw new BadRequestException('Error al obtener el resumen de pagos: ' + error.message);
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

    private createPaginationInfo(page: number, limit: number, total: number) {
        return {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            limit,
        };
    }
}
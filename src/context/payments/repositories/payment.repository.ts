import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Payment, PaymentFilters, PaymentStats } from '../entities/payment.entity';
import { PaymentDocument } from '../schemas/payment.schema';

@Injectable()
export class PaymentRepository {
    private readonly logger = new Logger(PaymentRepository.name);

    constructor(
        @InjectModel('Payment')
        private readonly paymentModel: Model<PaymentDocument>,
    ) { }

    async create(paymentData: Partial<Payment>): Promise<Payment> {
        try {
            const createdPayment = await this.paymentModel.create(paymentData);
            return new Payment(createdPayment.toObject());
        } catch (error) {
            this.logger.error('Error creating payment', { error, paymentData });
            throw error;
        }
    }

    async findAll(
        page: number,
        limit: number,
        filters: PaymentFilters = {}
    ): Promise<{ payments: Payment[]; total: number }> {
        try {
            const query = this.buildQuery(filters);
            const skip = (page - 1) * limit;

            const [payments, total] = await Promise.all([
                this.paymentModel
                    .find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.paymentModel.countDocuments(query).exec(),
            ]);

            return {
                payments: payments.map(payment => new Payment(payment.toObject())),
                total,
            };
        } catch (error) {
            this.logger.error('Error finding payments', { error, page, limit, filters });
            throw error;
        }
    }

    async findById(id: string): Promise<Payment | null> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                return null;
            }

            const payment = await this.paymentModel.findById(id).exec();
            return payment ? new Payment(payment.toObject()) : null;
        } catch (error) {
            this.logger.error('Error finding payment by id', { error, id });
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            if (!Types.ObjectId.isValid(id)) {
                return false;
            }

            const result = await this.paymentModel.findByIdAndDelete(id).exec();
            return result !== null;
        } catch (error) {
            this.logger.error('Error deleting payment', { error, id });
            throw error;
        }
    }

    async getStats(filters?: PaymentFilters): Promise<PaymentStats> {
        try {
            const query = this.buildQuery(filters || {});

            const [totalPayments, amountStats] = await Promise.all([
                this.paymentModel.countDocuments(query).exec(),
                this.paymentModel.aggregate([
                    { $match: query },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' },
                            averageAmount: { $avg: '$amount' },
                        },
                    },
                ]).exec(),
            ]);

            const stats = amountStats[0] || { totalAmount: 0, averageAmount: 0 };

            return {
                totalPayments,
                totalAmount: stats.totalAmount || 0,
                averageAmount: stats.averageAmount || 0,
            };
        } catch (error) {
            this.logger.error('Error getting payment stats', { error, filters });
            throw error;
        }
    }

    private buildQuery(filters: PaymentFilters): any {
        const query: any = {};

        if (filters.clientId) {
            query.clientId = filters.clientId;
        }

        if (filters.clientName) {
            query.clientName = { $regex: filters.clientName, $options: 'i' };
        }

        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                const startDate = this.parseToStartOfDay(filters.startDate);
                query.createdAt.$gte = startDate;
                this.logger.log('Start date filter', {
                    input: filters.startDate,
                    parsed: startDate.toISOString()
                });
            }
            if (filters.endDate) {
                const endDate = this.parseToEndOfDay(filters.endDate);
                query.createdAt.$lte = endDate;
                this.logger.log('End date filter', {
                    input: filters.endDate,
                    parsed: endDate.toISOString()
                });
            }
            this.logger.log('Final query for createdAt', { createdAtQuery: query.createdAt });
        }

        if (filters.minAmount !== undefined) {
            query.amount = { ...query.amount, $gte: filters.minAmount };
        }

        if (filters.maxAmount !== undefined) {
            query.amount = { ...query.amount, $lte: filters.maxAmount };
        }

        return query;
    }

    /**
     * Parse date string to start of day (00:00:00.000)
     * Handles YYYY-MM-DD format correctly
     */
    private parseToStartOfDay(dateString: string): Date {
        // Si viene en formato YYYY-MM-DD, parseamos correctamente
        const dateParts = dateString.includes('T')
            ? dateString.split('T')[0]
            : dateString;

        const [year, month, day] = dateParts.split('-').map(Number);

        // Crear fecha en la zona horaria local
        const date = new Date(year, month - 1, day, 0, 0, 0, 0);

        this.logger.log('Parsing start of day', {
            input: dateString,
            parsed: date.toISOString(),
            local: date.toString()
        });

        return date;
    }

    /**
     * Parse date string to end of day (23:59:59.999)
     * Handles YYYY-MM-DD format correctly
     */
    private parseToEndOfDay(dateString: string): Date {
        // Si viene en formato YYYY-MM-DD, parseamos correctamente
        const dateParts = dateString.includes('T')
            ? dateString.split('T')[0]
            : dateString;

        const [year, month, day] = dateParts.split('-').map(Number);

        // Crear fecha en la zona horaria local
        const date = new Date(year, month - 1, day, 23, 59, 59, 999);

        this.logger.log('Parsing end of day', {
            input: dateString,
            parsed: date.toISOString(),
            local: date.toString()
        });

        return date;
    }
}
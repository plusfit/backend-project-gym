export class Payment {
    _id?: string;
    amount: number;
    clientId: string;
    clientName: string;
    deleted: boolean;
    createdAt?: Date;

    constructor(payment: Partial<Payment>) {
        this._id = payment._id;
        this.amount = payment.amount!;
        this.clientId = payment.clientId!;
        this.clientName = payment.clientName!;
        this.deleted = payment.deleted ?? false;
        this.createdAt = payment.createdAt;
    }
}

export interface PaymentFilters {
    clientId?: string;
    clientName?: string;
    deleted?: boolean;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
}

export interface PaymentStats {
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
    activePayments: number;
    deletedPayments: number;
}
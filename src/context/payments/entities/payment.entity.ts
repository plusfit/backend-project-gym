export class Payment {
    _id?: string;
    amount: number;
    clientId: string;
    clientName: string;
    createdAt?: Date;

    constructor(payment: Partial<Payment>) {
        this._id = payment._id;
        this.amount = payment.amount!;
        this.clientId = payment.clientId!;
        this.clientName = payment.clientName!;
        this.createdAt = payment.createdAt;
    }
}

export interface PaymentFilters {
    clientId?: string;
    clientName?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
}export interface PaymentStats {
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
}
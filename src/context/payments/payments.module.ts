import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentSchema } from './schemas/payment.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Payment', schema: PaymentSchema },
        ]),
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentRepository],
    exports: [PaymentsService, PaymentRepository],
})
export class PaymentsModule { }
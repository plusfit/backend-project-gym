import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    Logger,
} from '@nestjs/common';
import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GetPaymentsDto } from './dto/get-payments.dto';
import { UpdatePaymentAmountDto } from './dto/update-payment-amount.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createPaymentDto: CreatePaymentDto) {
        let payment = await this.paymentsService.create(createPaymentDto);
        return payment;
    }

    @Get()
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    async findAll(@Query() queryDto: GetPaymentsDto) {

        const result = await this.paymentsService.findAll(queryDto);

        return result;
    }

    @Get(':id')
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    async findById(@Param('id') id: string) {
        const payment = await this.paymentsService.findById(id);

        return payment;
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @UseGuards(RolesGuard)
    @HttpCode(HttpStatus.OK)
    async updateAmount(
        @Param('id') id: string,
        @Body() updatePaymentAmountDto: UpdatePaymentAmountDto
    ) {
        const updatedPayment = await this.paymentsService.updateAmount(id, updatePaymentAmountDto);

        this.logger.log(`Payment amount updated successfully for ID: ${id}`);
        return updatedPayment;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async delete(@Param('id') id: string) {
        const result = await this.paymentsService.delete(id);
        return result;
    }
}
import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CheckInsController } from "@/src/context/check-ins/check-ins.controller";
import { CheckInsService } from "@/src/context/check-ins/check-ins.service";
import { CHECK_IN_REPOSITORY } from "@/src/context/check-ins/repositories/check-in.repository";
import { MongoCheckInRepository } from "@/src/context/check-ins/repositories/mongo-check-in.repository";
import { CheckInSchema } from "@/src/context/check-ins/schemas/check-in.schema";
import { ClientsModule } from "@/src/context/clients/clients.module";

@Module({
	controllers: [CheckInsController],
	imports: [
		MongooseModule.forFeature([{ name: "CheckIn", schema: CheckInSchema }]),
		forwardRef(() => ClientsModule),
	],
	providers: [
		CheckInsService,
		{
			provide: CHECK_IN_REPOSITORY,
			useClass: MongoCheckInRepository,
		},
	],
	exports: [CheckInsService, CHECK_IN_REPOSITORY],
})
export class CheckInsModule {}
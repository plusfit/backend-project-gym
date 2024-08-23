import { Module } from "@nestjs/common";

import { ExcercisesController } from "./excercises.controller";
import { ExcercisesService } from "./excercises.service";

@Module({
  controllers: [ExcercisesController],
  providers: [ExcercisesService],
})
export class ExcercisesModule {}

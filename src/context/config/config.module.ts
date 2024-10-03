import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

// import { ConfigSchema } from "@/src/context/config/schemas/config.schema";
import { ConfigController } from "./config.controller";
import { ConfigService } from "./config.service";
import {
  CONFIG_REPOSITORY,
  MongoConfigRepository,
} from "./repositories/mongo-config.repository";
import { Config, ConfigSchema } from "./schemas/config.schemas";

@Module({
  controllers: [ConfigController],
  imports: [
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
  ],
  providers: [
    ConfigService,
    {
      provide: CONFIG_REPOSITORY,
      useClass: MongoConfigRepository,
    },
  ],
  exports: ["ConfigRepository", ConfigService],
})
export class AppConfigModule {}

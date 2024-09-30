import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { ConfigService } from "./config.service";
import { CreateConfigDto } from "./dto/create-config.dto";
import { UpdateConfigDto } from "./dto/update-config.dto";

@ApiTags("config")
@Controller("config")
export class ConfigController {
  logger = new Logger(ConfigService.name);
  constructor(private readonly configService: ConfigService) {}

  @Post("create")
  @ApiResponse({ status: 201, description: "Config created successfully." })
  create(@Body() createConfigDto: CreateConfigDto) {
    return this.configService.createConfig(createConfigDto);
  }

  @Get()
  getConfigs() {
    this.logger.log("Getting plans");
    return this.configService.getConfigs();
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.update(id, updateConfigDto);
  }
}

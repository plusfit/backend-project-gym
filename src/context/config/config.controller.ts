import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { ConfigService } from "./config.service";
import { CreateConfigDto } from "./dto/create-config.dto";
import { UpdateConfigDto } from "./dto/update-config.dto";

@ApiTags("config")
@Controller("config")
export class ConfigController {
  logger = new Logger(ConfigService.name);
  constructor(private readonly configService: ConfigService) {}

  @Post("create")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
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

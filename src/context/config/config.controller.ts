import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";

import { PageDto } from "../shared/dtos/page.dto";
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
  getConfigs(@Query() pageDto: PageDto) {
    this.logger.log("Getting plans");
    return this.configService.getConfigs(pageDto.page, pageDto.limit);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.configService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.update(+id, updateConfigDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.configService.remove(+id);
  }
}

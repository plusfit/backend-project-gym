import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import { CreateConfigDto } from "./dto/create-config.dto";
import { UpdateConfigDto } from "./dto/update-config.dto";
import { CONFIG_REPOSITORY } from "./repositories/mongo-config.repository";

@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIG_REPOSITORY)
    private readonly configRepository: any,
  ) {}

  createConfig(createConfigDto: CreateConfigDto) {
    if (!createConfigDto) {
      throw new BadRequestException("Invalid config data");
    }

    return this.configRepository.createConfig(createConfigDto);
  }

  async getConfigs(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.configRepository.getConfigs(offset, limit),
      this.configRepository.countConfigs(),
    ]);
    return { data, total, page, limit };
  }

  update(id: number, updateConfigDto: UpdateConfigDto) {
    if (!updateConfigDto) {
      throw new BadRequestException("Invalid config data");
    }
  }
}

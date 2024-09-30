import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import { CreateConfigDto } from "./dto/create-config.dto";
import { UpdateConfigDto } from "./dto/update-config.dto";
import { Config } from "./entities/config.entity";
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

  async getConfigs(): Promise<Config> {
    const result = await this.configRepository.getConfigs();
    if (!result) {
      return {
        schedule: [],
      };
    }
    return result[0];
  }

  async update(id: string, updateConfigDto: UpdateConfigDto) {
    try {
      if (!updateConfigDto && !id) {
        throw new BadRequestException("Invalid config data");
      }

      await this.configRepository.update(id, updateConfigDto);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error during update or updateSchedule:", error);
      throw error;
    }
  }
}

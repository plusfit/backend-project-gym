import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateConfigDto } from "../dto/create-config.dto";
import { Config } from "../schemas/config.schemas";
import { ConfigRepository } from "./config.repository";
export const CONFIG_REPOSITORY = "ConfigRepository";

export class MongoConfigRepository implements ConfigRepository {
  constructor(@InjectModel(Config.name) private configModel: Model<Config>) {}

  async createConfig(config: CreateConfigDto): Promise<Config> {
    const newConfig = new this.configModel(config);
    return newConfig.save();
  }

  async getConfigs(): Promise<Config[]> {
    return this.configModel.find().lean();
  }

  async countConfigs(): Promise<number> {
    return await this.configModel.countDocuments().exec();
  }
}

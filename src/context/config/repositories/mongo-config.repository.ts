import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateConfigDto } from "../dto/create-config.dto";
import { Config, ConfigDocument } from "../schemas/config.schemas";
import { ConfigRepository } from "./config.repository";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";
export const CONFIG_REPOSITORY = "ConfigRepository";

export class MongoConfigRepository implements ConfigRepository {
  constructor(
    @InjectModel(Config.name) private configModel: Model<ConfigDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async createConfig(config: CreateConfigDto): Promise<Config> {
    const tenantData = {
      ...config,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    const newConfig = new this.configModel(tenantData);
    return newConfig.save();
  }

  async getConfigs(): Promise<Config[]> {
    return this.configModel.find(this.addTenantFilter()).lean();
  }

  async countConfigs(): Promise<number> {
    return await this.configModel.countDocuments(this.addTenantFilter()).exec();
  }

  async update(id: string, updateData: any): Promise<Config | null> {
    return this.configModel
      .findOneAndUpdate(this.addTenantFilter({ _id: id }), updateData, {
        new: true,
      })
      .exec();
  }
}

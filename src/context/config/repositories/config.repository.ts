import { CreateConfigDto } from "../dto/create-config.dto";
import { Config } from "../schemas/config.schemas";

export interface ConfigRepository {
  createConfig(config: CreateConfigDto): Promise<Config>;
  getConfigs(offset: number, limit: number): Promise<Config[]>;
  countConfigs(): Promise<number>;
  update(id: string, updateData: any): Promise<Config | null>;
}

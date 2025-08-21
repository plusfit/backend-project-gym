import { Premio, PremioFilters, PremioResponse } from '../entities/premio.entity';

export abstract class PremioRepository {
  abstract create(premio: Partial<Premio>): Promise<Premio>;
  abstract findAll(filters: PremioFilters): Promise<PremioResponse>;
  abstract findById(id: string): Promise<Premio | null>;
  abstract findByName(name: string): Promise<Premio | null>;
  abstract findEnabled(): Promise<Premio[]>;
  abstract update(id: string, premio: Partial<Premio>): Promise<Premio | null>;
  abstract delete(id: string): Promise<boolean>;
  abstract incrementCanjes(id: string): Promise<void>;
  abstract toggleEnabled(id: string): Promise<Premio | null>;
}
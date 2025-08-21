import { Canje, CanjeFilters, CanjeResponse } from '../entities/canje.entity';

export abstract class CanjeRepository {
  abstract create(canje: Partial<Canje>): Promise<Canje>;
  abstract findAll(filters: CanjeFilters): Promise<CanjeResponse>;
  abstract findById(id: string): Promise<Canje | null>;
  abstract findByClienteId(clienteId: string): Promise<Canje[]>;
  abstract findByPremioId(premioId: string): Promise<Canje[]>;
  abstract countByPremioId(premioId: string): Promise<number>;
  abstract update(id: string, canje: Partial<Canje>): Promise<Canje | null>;
  abstract delete(id: string): Promise<boolean>;
}
import { Inject, Injectable } from "@nestjs/common";

import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";

@Injectable()
export class ClientsService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: any,
  ) {}

  async findAll(page: number, limit: number, name?: string, email?: string) {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (email) {
      filters.email = email;
    }

    const [data, total] = await Promise.all([
      this.clientRepository.getClients(offset, limit, filters),
      this.clientRepository.countClients(filters),
    ]);
    return { data, total, page, limit };
  }

  findOne(id: string) {
    return this.clientRepository.getClientById(id);
  }

  update(id: string, updateClientDto: UpdateClientDto) {
    return this.clientRepository.updateClient(id, updateClientDto);
  }

  remove(id: string) {
    return this.clientRepository.removeClient(id);
  }

  assignRoutineToClient(clientId: string, routineId: string) {
    return this.clientRepository.assignRoutineToClient(clientId, routineId);
  }
}

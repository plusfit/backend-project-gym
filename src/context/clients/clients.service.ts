import { Inject, Injectable } from "@nestjs/common";

import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";

@Injectable()
export class ClientsService {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: any,
  ) {}

  findAll(page: number, limit: number, name?: string, email?: string) {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (email) {
      filters.type = email;
    }

    return this.clientRepository.getClients(offset, limit, filters);
  }

  findOne(id: string) {
    return this.clientRepository.getClientById(id);
  }

  update(id: string, updateClientDto: UpdateClientDto) {
    return this.clientRepository.updateClient(updateClientDto);
  }

  remove(id: string) {
    return this.clientRepository.removeClient(id);
  }
}

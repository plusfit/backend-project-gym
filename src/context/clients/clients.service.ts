import { Injectable } from "@nestjs/common";

import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Injectable()
export class ClientsService {
  create(createClientDto: CreateClientDto) {
    return createClientDto;
  }

  findAll() {
    return `This action returns all clients`;
  }

  findOne(id: number) {
    return `This action returns a #${id} client`;
  }

  update(id: number, updateClientDto: UpdateClientDto) {
    return updateClientDto;
  }

  remove(id: number) {
    return `This action removes a #${id} client`;
  }
}

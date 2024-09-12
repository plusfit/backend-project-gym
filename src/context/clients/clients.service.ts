import { Injectable } from "@nestjs/common";

import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";

@Injectable()
export class ClientsService {
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

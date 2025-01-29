import { Inject, Injectable } from "@nestjs/common";

import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { CLIENT_REPOSITORY } from "@/src/context/clients/repositories/clients.repository";

import { CreateClientDto } from "./dto/create-client.dto";

@Injectable()
export class ClientsService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: any,
  ) {}

  async findAll(page: number, limit: number, name?: string, email?: string) {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (name || email) {
      filters.$or = [];

      if (name) {
        filters.$or.push({ name: { $regex: name, $options: "i" } });
      }
      if (email) {
        filters.$or.push({ email: { $regex: email, $options: "i" } });
      }
    }

    const [data, total] = await Promise.all([
      this.clientRepository.getClients(offset, limit, filters),
      this.clientRepository.countClients(filters),
    ]);
    return { data, total, page, limit };
  }

  async getListClients(ids: string[]) {
    try {
      // Inicializamos un array vacío para almacenar los clientes obtenidos
      const clients = [];

      // Iteramos sobre los IDs de los clientes
      for (const id of ids) {
        // Esperamos a obtener el cliente de la base de datos
        const client = await this.clientRepository.getClientById(id);

        // Si el cliente existe, lo agregamos al array
        if (client) {
          clients.push(client);
        }
      }

      // Devolvemos el array de clientes obtenidos
      return clients;
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
      throw new Error("Error al obtener los clientes");
    }
  }

  findOne(id: string) {
    return this.clientRepository.getClientById(id);
  }

  create(createClientDto: CreateClientDto) {
    return this.clientRepository.createClient(createClientDto);
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

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ClientsService } from "@/src/context/clients/clients.service";
import { GetClientsDto } from "@/src/context/clients/dto/get-clients.dto";
import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { ClientsIdsDto } from "./dto/clients-ids.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { ClientFilters } from "./interfaces/clients.interface";

@ApiTags("clients")
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}
  @Post("list")
  getListClients(@Body() clientsIdsDto: ClientsIdsDto) {
    return this.clientsService.getListClients(clientsIdsDto.clientsIds);
  }

  @Get()
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  findAll(@Query() getClientsDto: GetClientsDto) {
    const filters: ClientFilters = {
      name: getClientsDto.name,
      email: getClientsDto.email,
      CI: getClientsDto.CI,
      role: getClientsDto.role,
      withoutPlan: getClientsDto.withoutPlan,
    };
    return this.clientsService.findAll(
      getClientsDto.page,
      getClientsDto.limit,
      filters,
    );
  }

  @Get(":id")
  // @Roles(Role.Admin, Role.Client)
  // @UseGuards(RolesGuard)
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(id);
  }

  @Post("create")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Patch(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  update(@Param("id") id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.clientsService.remove(id);
  }
}

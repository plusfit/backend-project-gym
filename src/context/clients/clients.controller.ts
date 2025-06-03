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
import { Permissions } from "@/src/context/shared/guards/permissions/permissions.decorator";
import { PermissionsGuard } from "@/src/context/shared/guards/permissions/permissions.guard";
import { Permission } from "@/src/context/shared/enums/permissions.enum";

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
  @Roles(Role.Admin)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.CLIENT_READ)
  findAll(@Query() getClientsDto: GetClientsDto) {
    const filters: ClientFilters = {
      name: getClientsDto.name,
      email: getClientsDto.email,
      CI: getClientsDto.CI,
      role: getClientsDto.role,
      withoutPlan: getClientsDto.withoutPlan,
      disabled: getClientsDto.disabled,
    };
    return this.clientsService.findAll(
      getClientsDto.page,
      getClientsDto.limit,
      filters,
    );
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.CLIENT_READ)
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(id);
  }

  @Post("create")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.CLIENT_CREATE)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Patch(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.CLIENT_UPDATE)
  update(@Param("id") id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Patch(":id/disabled")
  async toggleDisabled(
    @Param("id") id: string,
    @Body("disabled") disabled: boolean,
  ) {
    return this.clientsService.toggleDisabled(id, disabled);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Permissions(Permission.CLIENT_DELETE)
  remove(@Param("id") id: string) {
    return this.clientsService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { ClientsService } from "@/src/context/clients/clients.service";
import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { Role } from "@/src/context/shared/constants/roles.constant";

@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(+id);
  }

  @Patch(":id")
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  update(@Param("id") id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(+id, updateClientDto);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.clientsService.remove(+id);
  }
}

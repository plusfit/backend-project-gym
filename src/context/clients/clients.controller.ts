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
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { ClientsService } from "@/src/context/clients/clients.service";
import { GetClientsDto } from "@/src/context/clients/dto/get-clients.dto";
import { UpdateClientDto } from "@/src/context/clients/dto/update-client.dto";
import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { ClientsIdsDto } from "./dto/clients-ids.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { ValidatePasswordDto } from "./dto/validate-password.dto";
import { ClientFilters } from "./interfaces/clients.interface";

@ApiTags("clients")
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) { }
  @Post("list")
  getListClients(@Body() clientsIdsDto: ClientsIdsDto) {
    return this.clientsService.getListClients(clientsIdsDto.clientsIds);
  }

  @Get("count/active")
  @ApiOperation({ summary: "Get total count of active (non-disabled) clients" })
  @ApiResponse({ status: 200, description: "Returns the number of active clients" })
  async getActiveClientsCount() {
    return this.clientsService.getActiveClientsCount();
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
      disabled: getClientsDto.disabled,
    };
    return this.clientsService.findAll(
      getClientsDto.page,
      getClientsDto.limit,
      filters,
    );
  }

  @Get("validate/ci/:ci")
  @ApiOperation({ summary: "Validate if a client exists by CI (Cédula)" })
  @ApiResponse({ status: 200, description: "Returns validation result with client data if exists" })
  async validateClientByCI(@Param("ci") ci: string) {
    return this.clientsService.validateClientByCI(ci);
  }

  @Get(":id")
  // @Roles(Role.Admin, Role.Client)
  // @UseGuards(RolesGuard)
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(":id/password")
  @ApiOperation({ summary: "Get client password information for admin" })
  @ApiResponse({ status: 200, description: "Returns the actual password for admin access" })
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async getClientPassword(@Param("id") id: string) {
    const plainPassword = await this.clientsService.getClientPlainPassword(id);
    return {
      hasPassword: !!plainPassword,
      password: plainPassword || null,
      message: plainPassword ? "Password retrieved successfully" : "No password set"
    };
  }

  @Post(":id/validate-password")
  @ApiOperation({ summary: "Validate client password" })
  @ApiResponse({ status: 200, description: "Returns validation result" })
  @Roles(Role.Admin, Role.Client)
  @UseGuards(RolesGuard)
  async validatePassword(
    @Param("id") id: string,
    @Body() validatePasswordDto: ValidatePasswordDto,
  ) {
    const isValid = await this.clientsService.validateClientPassword(id, validatePasswordDto.password);
    return { isValid };
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

  @Patch(":id/disabled")
  async toggleDisabled(
    @Param("id") id: string,
    @Body("disabled") disabled: boolean,
  ) {
    return this.clientsService.toggleDisabled(id, disabled);
  }

  @Delete(":id")
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param("id") id: string) {
    return this.clientsService.remove(id);
  }
}

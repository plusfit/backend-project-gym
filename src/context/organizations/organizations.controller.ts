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
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";
import { ClientsService } from "@/src/context/clients/clients.service";

import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { UpdateOrganizationPermissionsDto } from "./dto/update-organization-permissions.dto";
import { OrganizationsService } from "./organizations.service";
import { Module } from "@/src/context/shared/enums/permissions.enum";

@ApiTags("organizations")
@Controller("organizations")
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly clientsService: ClientsService,
  ) {}

  @Post()
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Create a new organization" })
  @ApiResponse({
    status: 201,
    description: "Organization created successfully",
  })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    const { adminUser, ...orgData } = createOrganizationDto;
    
    // Crear la organización
    const organization = await this.organizationsService.create(createOrganizationDto);
    
    // Crear el admin usando los datos auxiliares
    const adminData = this.organizationsService.getAdminDataForOrganization(
      (organization as any)._id.toString(),
      adminUser
    );
    
    const admin = await this.clientsService.createAdminForOrganization(adminData);
    
    return {
      organization,
      admin,
    };
  }

  @Get()
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get all organizations" })
  @ApiResponse({ status: 200, description: "List of organizations" })
  findAll(@Query("includeInactive") includeInactive?: string) {
    const includeInactiveBool = includeInactive === "true";
    return this.organizationsService.findAll(includeInactiveBool);
  }

  @Get(":id")
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get organization by ID" })
  @ApiResponse({ status: 200, description: "Organization found" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  findOne(@Param("id") id: string) {
    return this.organizationsService.findById(id);
  }

  @Get(":id/plans")
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get all plans for an organization" })
  @ApiResponse({ status: 200, description: "List of organization plans" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  getOrganizationPlans(@Param("id") id: string) {
    return this.organizationsService.getOrganizationPlans(id);
  }

  @Get(":id/clients")
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get all clients for an organization" })
  @ApiResponse({ status: 200, description: "List of organization clients" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  getOrganizationClients(@Param("id") id: string) {
    return this.clientsService.getClientsByOrganizationId(id);
  }

  @Get(":id/routines")
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get all routines for an organization" })
  @ApiResponse({ status: 200, description: "List of organization routines" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  getOrganizationRoutines(@Param("id") id: string) {
    return this.organizationsService.getOrganizationRoutines(id);
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Get organization by slug" })
  @ApiResponse({ status: 200, description: "Organization found" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  findBySlug(@Param("slug") slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Patch(":id")
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Update organization" })
  @ApiResponse({
    status: 200,
    description: "Organization updated successfully",
  })
  @ApiResponse({ status: 404, description: "Organization not found" })
  update(
    @Param("id") id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(":id")
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Delete organization (soft delete)" })
  @ApiResponse({
    status: 200,
    description: "Organization deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Organization not found" })
  remove(@Param("id") id: string) {
    return this.organizationsService.delete(id);
  }

  @Patch(":id/permissions")
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Update organization permissions" })
  @ApiResponse({
    status: 200,
    description: "Organization permissions updated successfully",
  })
  @ApiResponse({ status: 404, description: "Organization not found" })
  updatePermissions(
    @Param("id") id: string,
    @Body() updatePermissionsDto: UpdateOrganizationPermissionsDto,
  ) {
    return this.organizationsService.updateOrganizationPermissions(
      id,
      updatePermissionsDto,
    );
  }

  @Get(":id/permissions")
  @Roles(Role.SuperAdmin, Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get organization permissions" })
  @ApiResponse({ status: 200, description: "Organization permissions" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  getPermissions(@Param("id") id: string) {
    return this.organizationsService.getOrganizationPermissions(id);
  }

  @Get(":id/permissions/:module")
  @Roles(Role.SuperAdmin, Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get organization permissions by module" })
  @ApiResponse({
    status: 200,
    description: "Organization permissions for specific module",
  })
  @ApiResponse({ status: 404, description: "Organization not found" })
  getPermissionsByModule(
    @Param("id") id: string,
    @Param("module") module: Module,
  ) {
    return this.organizationsService.getPermissionsByModule(id, module);
  }

  @Get(":id/client-stats")
  @Roles(Role.SuperAdmin, Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get organization client statistics" })
  @ApiResponse({
    status: 200,
    description: "Organization client statistics retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async getClientStats(@Param("id") id: string) {
    const clients = await this.clientsService.getClientsByOrganizationId(id);
    return this.organizationsService.getOrganizationClientStats(id, clients.length);
  }
}

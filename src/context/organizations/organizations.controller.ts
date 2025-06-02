import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationsService } from "./organizations.service";

@ApiTags("organizations")
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Create a new organization" })
  @ApiResponse({
    status: 201,
    description: "Organization created successfully",
  })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @Roles(Role.SuperAdmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get all organizations" })
  @ApiResponse({ status: 200, description: "List of organizations" })
  findAll() {
    return this.organizationsService.findAll();
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
}

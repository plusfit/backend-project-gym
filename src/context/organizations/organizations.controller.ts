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

import { Role } from "@/src/context/shared/constants/roles.constant";
import { Roles } from "@/src/context/shared/guards/roles/roles.decorator";
import { RolesGuard } from "@/src/context/shared/guards/roles/roles.guard";

import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
	constructor(private readonly organizationsService: OrganizationsService) {}

	@Post()
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	create(@Body() createOrganizationDto: CreateOrganizationDto) {
		return this.organizationsService.create(createOrganizationDto);
	}

	@Get()
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	findAll() {
		return this.organizationsService.findAll();
	}

	@Get(":id")
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	findOne(@Param("id") id: string) {
		return this.organizationsService.findOne(+id);
	}

	@Patch(":id")
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	update(
		@Param("id") id: string,
		@Body() updateOrganizationDto: UpdateOrganizationDto,
	) {
		return this.organizationsService.update(+id, updateOrganizationDto);
	}

	@Delete(":id")
	@Roles(Role.Admin)
	@UseGuards(RolesGuard)
	remove(@Param("id") id: string) {
		return this.organizationsService.remove(+id);
	}
}

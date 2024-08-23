import { Injectable } from "@nestjs/common";

import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Injectable()
export class OrganizationsService {
  create(createOrganizationDto: CreateOrganizationDto) {
    return createOrganizationDto;
  }

  findAll() {
    return `This action returns all organizations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} organization`;
  }

  update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    return updateOrganizationDto;
  }

  remove(id: number) {
    return `This action removes a #${id} organization`;
  }
}

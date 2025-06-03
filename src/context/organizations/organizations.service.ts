import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Organization,
  OrganizationDocument,
} from "./schemas/organization.schema";
import { PlansService } from "@/src/context/plans/plans.service";
import { ClientsService } from "@/src/context/clients/clients.service";
import { RoutinesService } from "@/src/context/routines/services/routines.service";
import { Plan } from "@/src/context/plans/schemas/plan.schema";
import { Client } from "@/src/context/clients/schemas/client.schema";
import { Routine } from "@/src/context/routines/schemas/routine.schema";
import {
  Permission,
  DEFAULT_PERMISSIONS,
  Module,
} from "@/src/context/shared/enums/permissions.enum";
import { UpdateOrganizationPermissionsDto } from "./dto/update-organization-permissions.dto";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly plansService: PlansService,
    private readonly clientsService: ClientsService,
    private readonly routinesService: RoutinesService,
  ) {}

  async create(
    organizationData: Partial<Organization>,
  ): Promise<OrganizationDocument> {
    if (!organizationData.permissions) {
      organizationData.permissions = Object.values(Permission);
    }
    const organization = new this.organizationModel(organizationData);
    return organization.save();
  }

  async findAll(includeInactive = true): Promise<OrganizationDocument[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return this.organizationModel.find(filter).exec();
  }

  async findById(id: string): Promise<OrganizationDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.organizationModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<OrganizationDocument | null> {
    return this.organizationModel.findOne({ slug, isActive: true }).exec();
  }

  async update(
    id: string,
    updateData: Partial<Organization>,
  ): Promise<OrganizationDocument> {
    const organization = await this.organizationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.organizationModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    return !!result;
  }

  async validateOrganizationExists(
    organizationId: Types.ObjectId,
  ): Promise<boolean> {
    const organization = await this.organizationModel
      .findOne({ _id: organizationId, isActive: true })
      .exec();

    return !!organization;
  }

  async getOrganizationPlans(organizationId: string): Promise<Plan[]> {
    // Verify organization exists
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Get all plans for this organization with high limit to get all
    const result = await this.plansService.getPlans(1, 1000);
    return result.data;
  }

  async getOrganizationClients(organizationId: string): Promise<Client[]> {
    // Verify organization exists
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Get all clients for this organization with high limit to get all
    const result = await this.clientsService.findAll(1, 1000, {});
    return result.data;
  }

  async updateOrganizationPermissions(
    organizationId: string,
    updatePermissionsDto: UpdateOrganizationPermissionsDto,
  ): Promise<OrganizationDocument> {
    const organization = await this.organizationModel
      .findByIdAndUpdate(
        organizationId,
        { permissions: updatePermissionsDto.permissions },
        { new: true },
      )
      .exec();

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    return organization;
  }

  async getOrganizationPermissions(
    organizationId: string,
  ): Promise<Permission[]> {
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }
    return organization.permissions;
  }

  async getPermissionsByModule(
    organizationId: string,
    module: Module,
  ): Promise<Permission[]> {
    const allPermissions =
      await this.getOrganizationPermissions(organizationId);
    const modulePermissions = DEFAULT_PERMISSIONS[module];

    return allPermissions.filter((permission) =>
      modulePermissions.includes(permission),
    );
  }

  async getOrganizationRoutines(organizationId: string): Promise<Routine[]> {
    // Verify organization exists
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Get all routines for this organization with high limit to get all
    const result = await this.routinesService.getRoutines(1, 1000);
    return result.data;
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Organization,
  OrganizationDocument,
} from "./schemas/organization.schema";
import { PlansService } from "@/src/context/plans/plans.service";
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
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly plansService: PlansService,
    private readonly routinesService: RoutinesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(
    organizationData: CreateOrganizationDto,
  ): Promise<OrganizationDocument> {
    if (!organizationData.permissions) {
      organizationData.permissions = Object.values(Permission);
    }

    // Si no se especifica maxClients, usar el valor por defecto
    if (!organizationData.maxClients) {
      organizationData.maxClients = 50;
    }

    const { adminUser, ...orgData } = organizationData;
    
    const organization = new this.organizationModel(orgData);
    const savedOrganization = await organization.save();

    return savedOrganization;
  }

  // Método auxiliar para obtener datos del admin para crear externamente
  getAdminDataForOrganization(organizationId: string, adminUser: any) {
    return {
      email: adminUser.email,
      role: "Admin",
      organizationId,
      userInfo: {
        name: adminUser.name,
        phone: adminUser.phone || null,
      },
      isOnboardingCompleted: false,
      disabled: false,
    };
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

    // Get plans directly by organization ID using repository method
    // This bypasses tenant context for SuperAdmin operations
    return await this.plansService.getPlansByOrganizationId(organizationId);
  }

  async getOrganizationClients(organizationId: string): Promise<Client[]> {
    // Este método será removido temporalmente para evitar dependencia circular
    // La funcionalidad se manejará directamente desde el controlador
    throw new Error("Use ClientsService.getClientsByOrganizationId directly from controller");
  }

  async updateOrganizationPermissions(
    organizationId: string,
    updatePermissionsDto: UpdateOrganizationPermissionsDto,
  ): Promise<OrganizationDocument> {
    if (
      !organizationId ||
      organizationId === "undefined" ||
      !Types.ObjectId.isValid(organizationId)
    ) {
      throw new NotFoundException(`Invalid organization ID: ${organizationId}`);
    }

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

    // Get routines directly by organization ID using service method
    // This bypasses tenant context for SuperAdmin operations
    return await this.routinesService.getRoutinesByOrganizationId(organizationId);
  }

  async getOrganizationClientStats(organizationId: string, clientCount: number): Promise<{
    currentClients: number;
    maxClients: number;
    available: number;
    percentage: number;
  }> {
    // Verify organization exists
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    // Use provided client count instead of fetching clients
    const currentClients = clientCount;
    const maxClients = organization.maxClients || 50;
    const available = Math.max(0, maxClients - currentClients);
    const percentage = maxClients > 0 ? (currentClients / maxClients) * 100 : 0;

    return {
      currentClients,
      maxClients,
      available,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    };
  }
}

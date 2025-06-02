import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Organization,
  OrganizationDocument,
} from "./schemas/organization.schema";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async create(
    organizationData: Partial<Organization>,
  ): Promise<OrganizationDocument> {
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
}

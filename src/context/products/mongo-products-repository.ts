import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateProductDto } from "@/src/context/products/dtos/create-product.dto";
import { ProductRepository } from "@/src/context/products/product-repository";
import {
  Product,
  ProductDocument,
} from "@/src/context/products/schemas/product.schema";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";

export class MongoProductsRepository implements ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async createProduct(product: CreateProductDto): Promise<Product> {
    const tenantData = {
      ...product,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    return await this.productModel.create(tenantData);
  }

  async getProducts(
    offset: number,
    limit: number,
    filters: { name?: string; productType?: string } = {},
  ): Promise<Product[]> {
    const filter: any = {};
    if (filters.name) {
      filter.name = { $regex: filters.name, $options: "i" };
    }
    if (filters.productType) {
      filter.category = filters.productType;
    }

    return await this.productModel
      .find(this.addTenantFilter(filter))
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countProducts(filters: any = {}): Promise<number> {
    const filter: any = {};
    if (filters.name) {
      filter.name = { $regex: filters.name, $options: "i" };
    }
    if (filters.productType) {
      filter.category = filters.productType;
    }
    return await this.productModel
      .countDocuments(this.addTenantFilter(filter))
      .exec();
  }
}

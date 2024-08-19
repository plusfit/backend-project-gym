import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateProductDto } from "@/src/context/products/dtos/create-product.dto";
import { ProductRepository } from "@/src/context/products/product-repository";
import { Product } from "@/src/context/products/schemas/product.schema";

export class MongoProductsRepository implements ProductRepository {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async createProduct(product: CreateProductDto): Promise<Product> {
    return await this.productModel.create(product);
  }

  async getProducts(
    offset: number,
    limit: number,
    filters: { name?: string; productType?: string } = {},
  ): Promise<Product[]> {
    return await this.productModel
      .find(filters)
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countProducts(filters: any = {}): Promise<number> {
    return await this.productModel.countDocuments(filters).exec();
  }
}

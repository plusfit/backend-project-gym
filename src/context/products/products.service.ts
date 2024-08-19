import { Inject, Injectable } from "@nestjs/common";

import { CreateProductDto } from "@/src/context/products/dtos/create-product.dto";
import {
  Product,
  ProductResponse,
} from "@/src/context/products/entities/product.entity";
import { PRODUCT_REPOSITORY } from "@/src/context/products/product-repository";

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: any,
  ) {}
  async createProduct(productDto: CreateProductDto): Promise<Product> {
    return await this.productRepository.createProduct(productDto);
  }

  async getProducts(
    page: number,
    limit: number,
    name?: string,
    productType?: string,
  ): Promise<ProductResponse> {
    const offset = (page - 1) * limit;
    const filters: any = {};

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (productType) {
      filters.productType = productType;
    }

    const [data, total] = await Promise.all([
      this.productRepository.getProducts(offset, limit, filters),
      this.productRepository.countProducts(filters),
    ]);
    return { data, total, page, limit };
  }
}

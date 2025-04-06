import { Body, Controller, Get, Logger, Post, Query } from "@nestjs/common";
import { ApiBody, ApiResponse } from "@nestjs/swagger";

import { CreateProductDto } from "@/src/context/products/dtos/create-product.dto";
import { FiltersDto } from "@/src/context/products/dtos/filters.dto";
import { PageDto } from "@/src/context/products/dtos/page.dto";
import {
	Product,
	ProductResponse,
} from "@/src/context/products/entities/product.entity";
import { ProductsService } from "@/src/context/products/products.service";

@Controller("products")
export class ProductsController {
	logger = new Logger(ProductsService.name);
	constructor(private readonly productsService: ProductsService) {}

	@ApiResponse({ status: 201, description: "Product created" })
	@ApiBody({
		description: "El producto",
		type: [CreateProductDto],
	})
	@Post("create")
	createProduct(@Body() createProductDto: CreateProductDto): Promise<Product> {
		this.logger.log("Creating a new Product");
		return this.productsService.createProduct(createProductDto);
	}

	@Get()
	getProducts(
		@Query() pageDto: PageDto,
		@Query() filtersDto: FiltersDto,
	): Promise<ProductResponse> {
		this.logger.log("Getting products");
		return this.productsService.getProducts(
			pageDto.page,
			pageDto.limit,
			filtersDto.name,
			filtersDto.productType,
		);
	}
}

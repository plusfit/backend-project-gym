import { CreateProductDto } from "@/src/context/products/dtos/create-product.dto";
import { Product } from "@/src/context/products/entities/product.entity";

export const PRODUCT_REPOSITORY = "ProductRepository";
export interface ProductRepository {
	createProduct(product: CreateProductDto): Promise<Product>;
	getProducts(
		offset: number,
		limit: number,
		filters: { name?: string; productType?: string },
	): Promise<Product[]>;
	countProducts(filters: {
		name?: string;
		productType?: string;
	}): Promise<number>;
}

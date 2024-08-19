import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MongoProductsRepository } from "@/src/context/products/mongo-products-repository";
import { PRODUCT_REPOSITORY } from "@/src/context/products/product-repository";
import { ProductsController } from "@/src/context/products/products.controller";
import { ProductsService } from "@/src/context/products/products.service";
import { ProductSchema } from "@/src/context/products/schemas/product.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Product", schema: ProductSchema }]),
  ],
  providers: [
    ProductsService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: MongoProductsRepository,
    },
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}

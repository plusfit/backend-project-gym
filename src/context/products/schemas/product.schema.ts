import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { TenantBaseEntity } from "@/src/context/shared/entities/tenant-base.entity";

@Schema({ timestamps: true })
export class Product extends TenantBaseEntity {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  stock!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export type ProductDocument = Product & Document;

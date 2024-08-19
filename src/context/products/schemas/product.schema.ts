import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Product extends Document {
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

  @Prop({ default: Date.now() })
  updatedAt!: Date;

  @Prop({ default: Date.now() })
  createdAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
export type ProductDocument = Product & Document;

import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateCategoryDto } from "../dto/create-category.dto";
import { Category } from "../entities/category.entity";

export class MongoCategoryRepository {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async createCategory(category: CreateCategoryDto): Promise<Category> {
    return await this.categoryModel.create(category);
  }

  async getCategories(offset: number, limit: number): Promise<Category[]> {
    return await this.categoryModel.find().skip(offset).limit(limit).exec();
  }
}

import { CreateCategoryDto } from "../dto/create-category.dto";
import { Category } from "../entities/category.entity";

export interface CategoryRepository {
  createCategory(category: CreateCategoryDto): Promise<Category>;
  getCategories(offset: number, limit: number): Promise<Category[]>;
  countCategories(): Promise<number>;
  findOne(id: string): Promise<Category | null>;
  update(id: string, category: CreateCategoryDto): Promise<Category | null>;
  remove(id: string): Promise<boolean>;
}

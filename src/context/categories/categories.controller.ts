import { Controller, Delete, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CategoriesService } from "./categories.service";
import { GetCategoriesDto } from "./dto/get-categories.dto";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // @Post()
  // create(@Body() createCategoryDto: CreateCategoryDto) {
  //   return this.categoriesService.create(createCategoryDto);
  // }

  @Get()
  findAll(@Query() getCategoriesDto: GetCategoriesDto) {
    const response = this.categoriesService.getCategories(
      getCategoriesDto.page,
      getCategoriesDto.limit,
      getCategoriesDto.name,
    );
    return response;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(+id);
  }

  // @Patch(":id")
  // update(
  //   @Param("id") id: string,
  //   @Body() updateCategoryDto: UpdateCategoryDto,
  // ) {
  //   return this.categoriesService.update(+id);
  // }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(+id);
  }
}

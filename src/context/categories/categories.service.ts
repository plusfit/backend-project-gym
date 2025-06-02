import { Injectable } from "@nestjs/common";

@Injectable()
export class CategoriesService {
  private categories = [
    { name: "Pecho" },
    { name: "Espalda" },
    { name: "Hombros" },
    { name: "Bíceps" },
    { name: "Tríceps" },
    { name: "Antebrazos" },
    { name: "Cuádriceps" },
    { name: "Isquiotibiales" },
    { name: "Glúteos" },
    { name: "Pantorrillas" },
    { name: "Core" },
    { name: "Zona Lumbar" },
    { name: "Pilométricos" },
    { name: "Trapecios" },
    { name: "Empuje" },
    { name: "Tracción" },
    { name: "Dominante de Rodilla" },
    { name: "Dominante de Cadera" },
    { name: "Estabilización" },
    { name: "Full Body" },
  ];

  create() {
    return "This action adds a new category";
  }

  getCategories(page: number, limit: number, name?: string) {
    const filteredCategories = name
      ? this.categories.filter(category =>
          category.name.toLowerCase().includes(name.toLowerCase()),
        )
      : this.categories;

    const total = filteredCategories.length;
    const offset = (page - 1) * limit;
    const data = filteredCategories.slice(offset, offset + limit);

    return { data, total, page, limit };
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}

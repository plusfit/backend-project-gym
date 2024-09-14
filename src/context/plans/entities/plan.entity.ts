import { Routine } from "@/src/context/routines/entities/routine.entity";

export class Plan {
  _id!: string;
  name!: string;
  category!: string;
  routines!: Routine[];
  daysCount!: number;
  days!: string[];
}

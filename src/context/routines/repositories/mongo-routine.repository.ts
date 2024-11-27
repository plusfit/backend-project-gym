import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateRoutineDto } from "@/src/context/routines/dto/create-routine.dto";
import { RoutineRepository } from "@/src/context/routines/repositories/routine.repository";
import { Routine } from "@/src/context/routines/schemas/routine.schema";

export const ROUTINE_REPOSITORY = "RoutineRepository";
export const SUB_ROUTINE_REPOSITORY = "RoutineRepository";

export class MongoRoutineRepository implements RoutineRepository {
  constructor(
    @InjectModel(Routine.name) private routineModel: Model<Routine>,
  ) {}

  async findById(id: string): Promise<Routine | null> {
    return this.routineModel.findById(id).lean();
  }

  async updateRoutine(id: string, updateData: any): Promise<Routine | null> {
    return this.routineModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async createRoutine(routine: CreateRoutineDto): Promise<Routine> {
    const newRoutine = new this.routineModel(routine);
    return newRoutine.save();
  }

  async deleteRoutine(id: string): Promise<void> {
    await this.routineModel.findByIdAndDelete(id).exec();
  }

  async getRoutines(
    offset: number,
    limit: number,
    filters: any,
  ): Promise<Routine[]> {
    return await this.routineModel
      .find(filters)
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countRoutines(filters: any): Promise<number> {
    return await this.routineModel.countDocuments(filters).exec();
  }
}

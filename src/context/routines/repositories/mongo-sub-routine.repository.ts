import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateSubRoutineDto } from "@/src/context/routines/dto/create-sub-routine.dto";

import { SubRoutine } from "../schemas/sub-routine.schema";
import { SubRoutineRepository } from "./sub-routine.repository";

export const ROUTINE_REPOSITORY = "RoutineRepository";
export const SUB_ROUTINE_REPOSITORY = "SubRoutineRepository";

export class MongoSubRoutineRepository implements SubRoutineRepository {
  constructor(
    @InjectModel(SubRoutine.name) private routineModel: Model<SubRoutine>,
  ) {}

  async findById(id: string): Promise<SubRoutine | null> {
    return this.routineModel.findById(id).populate("exercises").exec();
  }

  async updateSubRoutine(
    id: string,
    updateData: any,
  ): Promise<SubRoutine | null> {
    return this.routineModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async createSubRoutine(routine: CreateSubRoutineDto): Promise<SubRoutine> {
    const newRoutine = new this.routineModel(routine);
    return newRoutine.save();
  }

  async deleteSubRoutine(id: string): Promise<void> {
    await this.routineModel.findByIdAndDelete(id).exec();
  }

  async getSubRoutines(
    offset: number,
    limit: number,
    filters: any,
  ): Promise<SubRoutine[]> {
    return await this.routineModel
      .find(filters)
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async countSubRoutines(filters: any): Promise<number> {
    return await this.routineModel.countDocuments(filters).exec();
  }
}

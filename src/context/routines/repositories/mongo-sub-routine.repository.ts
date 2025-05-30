import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateSubRoutineDto } from "@/src/context/routines/dto/create-sub-routine.dto";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";

import { SubRoutine, SubRoutineDocument } from "../schemas/sub-routine.schema";
import { SubRoutineRepository } from "./sub-routine.repository";

export const ROUTINE_REPOSITORY = "RoutineRepository";
export const SUB_ROUTINE_REPOSITORY = "SubRoutineRepository";

export class MongoSubRoutineRepository implements SubRoutineRepository {
  constructor(
    @InjectModel(SubRoutine.name)
    private routineModel: Model<SubRoutineDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async findById(id: string): Promise<SubRoutine | null> {
    return this.routineModel
      .findOne(this.addTenantFilter({ _id: id }))
      .populate("exercises")
      .exec();
  }

  async updateSubRoutine(
    id: string,
    updateData: any,
  ): Promise<SubRoutine | null> {
    return this.routineModel
      .findOneAndUpdate(this.addTenantFilter({ _id: id }), updateData, {
        new: true,
      })
      .populate("exercises")
      .exec();
  }

  async createSubRoutine(routine: CreateSubRoutineDto): Promise<SubRoutine> {
    const tenantData = {
      ...routine,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    const newRoutine = new this.routineModel(tenantData);
    return newRoutine.save();
  }

  async deleteSubRoutine(id: string): Promise<any> {
    return await this.routineModel
      .deleteOne(this.addTenantFilter({ _id: id }))
      .exec();
  }

  async getSubRoutines(
    offset: number,
    limit: number,
    filters: any,
  ): Promise<SubRoutine[]> {
    return await this.routineModel
      .find(this.addTenantFilter(filters))
      .skip(offset)
      .limit(limit)
      .populate("exercises")
      .exec();
  }

  async countSubRoutines(filters: any): Promise<number> {
    return await this.routineModel
      .countDocuments(this.addTenantFilter(filters))
      .exec();
  }

  async removeExerciseFromSubRoutines(exercisesId: string): Promise<any> {
    return await this.routineModel.updateMany(
      this.addTenantFilter({ exercises: exercisesId }),
      { $pull: { exercises: exercisesId } },
    );
  }
}

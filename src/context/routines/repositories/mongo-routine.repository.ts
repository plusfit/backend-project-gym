import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateRoutineDto } from "@/src/context/routines/dto/create-routine.dto";
import { RoutineRepository } from "@/src/context/routines/repositories/routine.repository";
import {
  Routine,
  RoutineDocument,
} from "@/src/context/routines/schemas/routine.schema";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";

export const ROUTINE_REPOSITORY = "RoutineRepository";
export const SUB_ROUTINE_REPOSITORY = "RoutineRepository";

@Injectable()
export class MongoRoutineRepository implements RoutineRepository {
  constructor(
    @InjectModel(Routine.name) private routineModel: Model<RoutineDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async findById(id: string): Promise<Routine | null> {
    return this.routineModel
      .findOne(this.addTenantFilter({ _id: id }))
      .populate({
        path: "subRoutines",
        populate: {
          path: "exercises",
        },
      })
      .exec();
  }

  async updateRoutine(id: string, updateData: any): Promise<Routine | null> {
    return this.routineModel
      .findOneAndUpdate(this.addTenantFilter({ _id: id }), updateData, {
        new: true,
      })
      .populate({
        path: "subRoutines",
        populate: {
          path: "exercises",
        },
      })
      .exec();
  }

  async createRoutine(routine: CreateRoutineDto): Promise<Routine> {
    const tenantData = {
      ...routine,
      organizationId: this.tenantContext.getOrganizationId(),
    };
    const newRoutine = new this.routineModel(tenantData);
    return newRoutine.save();
  }

  async deleteRoutine(id: string): Promise<any> {
    return await this.routineModel
      .deleteOne(this.addTenantFilter({ _id: id }))
      .exec();
  }

  async getRoutines(
    offset: number,
    limit: number,
    filters: any,
  ): Promise<Routine[]> {
    return await this.routineModel
      .find(this.addTenantFilter(filters))
      .skip(offset)
      .limit(limit)
      .populate({
        path: "subRoutines",
        populate: {
          path: "exercises",
        },
      })
      .exec();
  }

  async countRoutines(filters: any): Promise<number> {
    return await this.routineModel
      .countDocuments(this.addTenantFilter(filters))
      .exec();
  }

  getRoutinesBySubRoutine(subRoutineId: string): Promise<Routine[]> {
    return this.routineModel
      .find(this.addTenantFilter({ subRoutines: subRoutineId }))
      .populate({
        path: "subRoutines",
        populate: {
          path: "exercises",
        },
      })
      .exec();
  }

  async removeSubRoutineFromRoutines(subRoutineId: string): Promise<any[]> {
    try {
      const routinesAffected = await this.routineModel
        .find(this.addTenantFilter({ subRoutines: subRoutineId }))
        .exec();

      if (!routinesAffected || routinesAffected.length === 0) {
        return [];
      }

      await this.routineModel
        .updateMany(this.addTenantFilter({ subRoutines: subRoutineId }), {
          $pull: { subRoutines: subRoutineId },
        })
        .exec();

      return await this.routineModel
        .find(
          this.addTenantFilter({
            _id: { $in: routinesAffected.map((routine) => routine._id) },
          }),
        )
        .populate({
          path: "subRoutines",
          populate: {
            path: "exercises",
          },
        })
        .exec();
    } catch (error: any) {
      throw new HttpException(
        `Error al remover la subroutine de las rutinas: ${error.message}`,
        error.status || 500,
      );
    }
  }
}

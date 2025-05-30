import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateExerciseDto } from "@/src/context/exercises/dto/create-exercise.dto";
import { UpdateExerciseDto } from "@/src/context/exercises/dto/update-exercise.dto";
import { ExerciseRepository } from "@/src/context/exercises/repositories/exercise.repository";
import {
  Exercise,
  ExerciseDocument,
} from "@/src/context/exercises/schemas/exercise.schema";
import { TenantContextService } from "@/src/context/shared/services/tenant-context.service";

export class MongoExercisesRepository implements ExerciseRepository {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    private readonly tenantContext: TenantContextService,
  ) {}

  private addTenantFilter<K>(filter: any = {}): any {
    return {
      ...filter,
      organizationId: this.tenantContext.getOrganizationId(),
    };
  }

  async createExercise(exercise: CreateExerciseDto): Promise<Exercise> {
    try {
      const tenantData = {
        ...exercise,
        organizationId: this.tenantContext.getOrganizationId(),
      };
      return await this.exerciseModel.create(tenantData);
    } catch (error: any) {
      throw new Error(`Error creating exercise: ${error.message}`);
    }
  }

  async getExercises(
    offset: number,
    limit: number,
    filters: { name?: string; exerciseType?: string } = {},
  ): Promise<Exercise[]> {
    try {
      const filter: any = {};
      if (filters.name) {
        filter.name = { $regex: filters.name, $options: "i" };
      }
      if (filters.exerciseType) {
        filter.type = filters.exerciseType;
      }

      return this.exerciseModel
        .find(this.addTenantFilter(filter))
        .skip(offset)
        .limit(limit)
        .exec();
    } catch {
      throw "Error fetching exercises";
    }
  }

  async countExercises(filters: any = {}): Promise<number> {
    try {
      const filter: any = {};
      if (filters.name) {
        filter.name = { $regex: filters.name, $options: "i" };
      }
      if (filters.exerciseType) {
        filter.type = filters.exerciseType;
      }
      return this.exerciseModel
        .countDocuments(this.addTenantFilter(filter))
        .exec();
    } catch (error: any) {
      throw new Error(`Error counting exercises: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Exercise | undefined> {
    try {
      const exercise = await this.exerciseModel
        .findOne(this.addTenantFilter({ _id: id }))
        .exec();
      return exercise ?? undefined;
    } catch (error: any) {
      throw new Error(`Error fetching exercise: ${error.message}`);
    }
  }

  async updateExercise(
    id: string,
    exercise: UpdateExerciseDto,
  ): Promise<Exercise | null> {
    try {
      return await this.exerciseModel
        .findOneAndUpdate(this.addTenantFilter({ _id: id }), exercise, {
          new: true,
        })
        .exec();
    } catch (error: any) {
      throw new Error(
        `Error updating exercise with id ${id}: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.exerciseModel
      .deleteOne(this.addTenantFilter({ _id: id }))
      .exec();
    return result.deletedCount > 0;
  }
}

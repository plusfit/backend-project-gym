import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";
import { Document } from "mongoose";
import { TenantBaseEntity } from "@/src/context/shared/entities/tenant-base.entity";

@Schema({ timestamps: true })
export class Exercise extends TenantBaseEntity {
  @Prop({ required: true })
  @IsString()
  name!: string;

  @Prop({ required: true })
  @IsString()
  description!: string;

  @Prop({ required: true })
  @IsString()
  category!: string;

  @Prop()
  @IsString()
  gifUrl!: string;

  @Prop({ required: true })
  @IsString()
  type!: string;

  @Prop()
  @ValidateIf((obj) => obj.type === "cardio")
  @IsNumber()
  @IsOptional()
  minutes?: number;

  @Prop()
  @ValidateIf((obj) => obj.type === "cardio")
  @IsNumber()
  @IsOptional()
  rest?: number;

  @Prop()
  @ValidateIf((obj) => obj.type === "room")
  @IsNumber()
  @IsOptional()
  reps?: number;

  @Prop()
  @ValidateIf((obj) => obj.type === "room")
  @IsNumber()
  @IsOptional()
  series?: number;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
ExerciseSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export type ExerciseDocument = Exercise & Document;

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";
import { Document } from "mongoose";

@Schema()
export class Exercise extends Document {
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
	updatedAt!: Date;

	@Prop({ default: Date.now })
	createdAt!: Date;

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
export type ExerciseDocument = Exercise & Document;

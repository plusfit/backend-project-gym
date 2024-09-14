import { Transform } from "class-transformer";
import { IsMongoId } from "class-validator";

export class MongoIdDto {
  @IsMongoId({ message: "The ID provided is not a valid MongoDB ID" })
  @Transform(({ value }) => value.toString())
  id!: string;
}

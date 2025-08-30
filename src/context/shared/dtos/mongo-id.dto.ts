import { Transform } from "class-transformer";
import { IsMongoId } from "class-validator";

export class MongoIdDto {
	@IsMongoId({ message: "El ID proporcionado no es un ID válido de MongoDB" })
	@Transform(({ value }) => value.toString())
	id!: string;
}

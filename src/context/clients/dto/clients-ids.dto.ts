import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsMongoId } from "class-validator";

export class ClientsIdsDto {
  @ApiProperty({ description: "Lista de ids", example: "1,2,3" })
  @IsArray()
  @IsMongoId({ each: true })
  clientsIds!: string[];
}

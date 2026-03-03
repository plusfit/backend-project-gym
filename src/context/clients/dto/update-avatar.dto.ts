import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUrl } from "class-validator";

export class UpdateAvatarDto {
    @ApiProperty({
        description: "URL del avatar del usuario",
        example: "https://example.com/avatar.jpg"
    })
    @IsNotEmpty({ message: "El avatarUrl es requerido" })
    @IsString({ message: "El avatarUrl debe ser un string" })
    @IsUrl({}, { message: "El avatarUrl debe ser una URL válida" })
    avatarUrl!: string;
}

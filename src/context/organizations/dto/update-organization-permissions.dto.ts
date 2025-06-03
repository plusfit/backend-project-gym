import { IsArray, IsEnum } from "class-validator";
import { Permission } from "@/src/context/shared/enums/permissions.enum";

export class UpdateOrganizationPermissionsDto {
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions!: Permission[];
}

import { SetMetadata } from "@nestjs/common";
import { Permission, Module } from "@/src/context/shared/enums/permissions.enum";

export const PERMISSIONS_KEY = "permissions";
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequirePermissions = (module: Module, permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, { module, permissions });

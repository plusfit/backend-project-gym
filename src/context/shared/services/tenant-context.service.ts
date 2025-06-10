import { Injectable, Scope } from "@nestjs/common";
import { Types } from "mongoose";
import { Role } from "../constants/roles.constant";

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private _organizationId?: Types.ObjectId;
  private _userId?: Types.ObjectId;
  private _userRole?: string;

  setTenantContext(
    organizationId?: Types.ObjectId,
    userId?: Types.ObjectId,
    userRole?: string,
  ) {
    this._organizationId = organizationId;
    this._userId = userId;
    this._userRole = userRole;
  }

  getOrganizationId(): Types.ObjectId {
    // Allow SuperAdmin to operate without organization context
    if (this._userRole === Role.SuperAdmin) {
      return this._organizationId as Types.ObjectId;
    }

    if (!this._organizationId) {
      throw new Error("Organization context not set");
    }
    return this._organizationId;
  }

  getUserId(): Types.ObjectId | undefined {
    return this._userId;
  }

  getUserRole(): string | undefined {
    return this._userRole;
  }

  isAdmin(): boolean {
    return this._userRole === Role.Admin || this._userRole === Role.SuperAdmin;
  }

  isSuperAdmin(): boolean {
    return this._userRole === Role.SuperAdmin;
  }
}

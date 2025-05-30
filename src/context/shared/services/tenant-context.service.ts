import { Injectable, Scope } from "@nestjs/common";
import { Types } from "mongoose";

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private _organizationId?: Types.ObjectId;
  private _userId?: Types.ObjectId;
  private _userRole?: string;

  setTenantContext(
    organizationId: Types.ObjectId,
    userId?: Types.ObjectId,
    userRole?: string,
  ) {
    this._organizationId = organizationId;
    this._userId = userId;
    this._userRole = userRole;
  }

  getOrganizationId(): Types.ObjectId {
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
    return this._userRole === "Admin" || this._userRole === "SuperAdmin";
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import jwt from "jsonwebtoken";

import { PERMISSIONS_KEY } from "./permissions.decorator";
import { Permission } from "@/src/context/shared/enums/permissions.enum";
import { OrganizationsService } from "@/src/context/organizations/organizations.service";
import { Role } from "@/src/context/shared/constants/roles.constant";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.getRequiredPermissions(context);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(req.headers.authorization);
    const decoded = this.verifyToken(token);

    // If user is SuperAdmin, allow access to all resources
    if (decoded?.role === Role.SuperAdmin) {
      return true;
    }

    if (!decoded?.organizationId) {
      throw new ForbiddenException("Organization ID not found in token");
    }

    const organization = await this.organizationsService.findById(
      decoded.organizationId,
    );

    if (!organization) {
      throw new ForbiddenException("Organization not found");
    }

    const hasPermissions = this.checkPermissions(
      organization.permissions,
      requiredPermissions,
    );

    if (!hasPermissions) {
      throw new ForbiddenException(
        `Organization does not have required permissions: ${requiredPermissions.join(", ")}`,
      );
    }

    return true;
  }

  private getRequiredPermissions(
    context: ExecutionContext,
  ): Permission[] | undefined {
    return this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header not found");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedException("Token not found");
    }

    return token;
  }

  private verifyToken(token: string): any {
    const secret = this.configService.get<string>("JWT_ACCESS_SECRET");
    if (!secret) {
      throw new UnauthorizedException("JWT secret is not set");
    }

    try {
      return jwt.verify(token, secret);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }

  private checkPermissions(
    organizationPermissions: Permission[],
    requiredPermissions: Permission[],
  ): boolean {
    return requiredPermissions.every((permission) =>
      organizationPermissions.includes(permission),
    );
  }
}

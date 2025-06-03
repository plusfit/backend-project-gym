import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { TenantContextService } from "../services/tenant-context.service";
import { OrganizationsService } from "../../organizations/organizations.service";
import { OrganizationDocument } from "../../organizations/schemas/organization.schema";
import { Role } from "../constants/roles.constant";

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContext: TenantContextService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    try {
      if (req.method === "OPTIONS") {
        return next();
      }

      const organizationSlug = this.extractOrganizationSlug(req);

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException("Authorization header not found");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        throw new UnauthorizedException("Token not found");
      }

      const secret = this.configService.get<string>("JWT_ACCESS_SECRET") || "";
      const decoded = jwt.verify(token, secret) as JwtPayload;

      if (!decoded) {
        throw new UnauthorizedException("Invalid token");
      }

      // Special handling for SuperAdmin users
      if (decoded.role === Role.SuperAdmin) {
        if (organizationSlug) {
          // If SuperAdmin is accessing a specific organization, validate it exists
          const organization: OrganizationDocument | null =
            await this.organizationsService.findBySlug(organizationSlug);
          if (!organization) {
            throw new UnauthorizedException("Organization not found");
          }

          // Set context with the specified organization
          this.tenantContext.setTenantContext(
            new Types.ObjectId((organization as any)._id),
            new Types.ObjectId(decoded.userId),
            decoded.role,
          );
        } else {
          // SuperAdmin accessing without specific organization context
          // Set context with minimal required data
          this.tenantContext.setTenantContext(
            undefined as any, // Allow undefined organizationId for SuperAdmin
            new Types.ObjectId(decoded.userId),
            decoded.role,
          );
        }
        return next();
      }

      // For non-SuperAdmin users, require organization context
      if (!decoded.organizationId) {
        throw new UnauthorizedException("Organization context required");
      }

      if (organizationSlug) {
        const organization: OrganizationDocument | null =
          await this.organizationsService.findBySlug(organizationSlug);
        if (!organization) {
          throw new UnauthorizedException("Organization not found");
        }

        if (decoded.organizationId !== (organization as any)._id.toString()) {
          throw new UnauthorizedException("Organization mismatch");
        }
      }

      // TODO: Check if the organization is active and has a valid subscription

      this.tenantContext.setTenantContext(
        new Types.ObjectId(decoded.organizationId),
        new Types.ObjectId(decoded.userId),
        decoded.role,
      );

      next();
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private extractOrganizationSlug(req: FastifyRequest): string | null {
    // const host = req.headers.host;
    // if (host) {
    //   const subdomain = host.split(".")[0];
    //   if (subdomain && subdomain !== "www" && subdomain !== "api") {
    //     return subdomain;
    //   }
    // }

    const orgHeader = req.headers["x-organization"] as string;
    if (orgHeader) {
      return orgHeader;
    }

    const pathMatch = req.url?.match(/^\/api\/org\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    return null;
  }
}

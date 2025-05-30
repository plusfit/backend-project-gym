import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const request = context.switchToHttp().getRequest();

      if (request.method === "OPTIONS") {
        // Ignora las solicitudes OPTIONS
        return true;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException("Authorization header not found");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        throw new UnauthorizedException("Token not found");
      }

      const secret = this.configService.get<string>("JWT_ACCESS_SECRET") || "";

      const decoded = jwt.verify(token, secret) as any;

      if (!decoded) {
        throw new UnauthorizedException("Invalid token");
      }

      // Agregar la información del usuario al request
      request.user = {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
        email: decoded.email,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

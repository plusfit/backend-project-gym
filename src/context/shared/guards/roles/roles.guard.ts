import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import jwt from "jsonwebtoken";

import { ROLES_KEY } from "@/src/context/shared/guards/roles/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly configService: ConfigService,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.getRequiredRoles(context);

		if (!requiredRoles) {
			return true; // Si no se requieren roles específicos, permite el acceso
		}

		const req = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(req.headers["authorization"]);
		const decoded = this.verifyToken(token);

		const userRole = decoded?.role; //del token obtengo el rol del usuario

		if (!userRole) {
			throw new ForbiddenException("Rol de usuario no encontrado");
		}

		const hasRole = this.userHasRequiredRole(userRole, requiredRoles);

		if (!hasRole) {
			throw new ForbiddenException("El usuario no tiene el rol requerido");
		}
		return true;
	}

	private getRequiredRoles(context: ExecutionContext): string[] | undefined {
		return this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
	}

	private extractTokenFromHeader(authHeader: string | undefined): string {
		if (!authHeader) {
			throw new UnauthorizedException("Encabezado de autorización no encontrado");
		}

		const token = authHeader.split(" ")[1];
		if (!token) {
			throw new UnauthorizedException("Token no encontrado");
		}

		return token;
	}

	private verifyToken(token: string): any {
		const secret = this.configService.get<string>("JWT_ACCESS_SECRET");
		if (!secret) {
			throw new UnauthorizedException("JWT secret no está configurado");
		}

		try {
			return jwt.verify(token, secret);
		} catch {
			throw new UnauthorizedException("Token inválido");
		}
	}

	private userHasRequiredRole(
		userRole: string,
		requiredRoles: string[],
	): boolean {
		return requiredRoles.includes(userRole);
	}
}

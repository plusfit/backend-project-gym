import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt from "jsonwebtoken";

export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const authHeader = request.headers["authorization"];

        if (!authHeader) {
            throw new UnauthorizedException("Encabezado de autorización no encontrado");
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new UnauthorizedException("Token no encontrado");
        }

        try {
            // Obtener el secret del entorno
            const secret = process.env.JWT_ACCESS_SECRET;
            if (!secret) {
                throw new UnauthorizedException("JWT secret no está configurado");
            }

            const decoded = jwt.verify(token, secret) as any;

            // Si se especifica un campo específico (ej: 'role', 'email'), devolver solo ese campo
            if (data) {
                return decoded[data];
            }

            // Si no, devolver todo el usuario decodificado
            return decoded;
        } catch {
            throw new UnauthorizedException("Token inválido");
        }
    }
);

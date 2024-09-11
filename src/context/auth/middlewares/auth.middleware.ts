import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    try {
      const authHeader = req.headers["authorization"];

      if (!authHeader) {
        throw new UnauthorizedException("Authorization header not found");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        throw new UnauthorizedException("Token not found");
      }

      const secret = this.configService.get<string>("JWT_ACCESS_SECRET") || "";

      const decoded = jwt.verify(token, secret);

      console.log(`MIDDLEWARE CORRECTO ${JSON.stringify(decoded)}`);

      next();
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

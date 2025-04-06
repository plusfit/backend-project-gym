import {
	Injectable,
	NestMiddleware,
	UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply, FastifyRequest } from "fastify";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
	constructor(private readonly configService: ConfigService) {}

	use(req: FastifyRequest, res: FastifyReply, next: () => void) {
		try {
			next();
		} catch {
			throw new UnauthorizedException("Invalid or expired token");
		}
	}
}

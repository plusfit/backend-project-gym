/* eslint-disable nestjs/use-dependency-injection */
import { randomUUID } from "node:crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";

export const CORRELATION_ID_HEADER = "X-Correlation-Id";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	use(req: any, res: any, next: () => void) {
		const id = randomUUID();
		req[CORRELATION_ID_HEADER] = id;
		
		// Para Fastify, usar setHeader en lugar de header
		if (res.setHeader) {
			res.setHeader(CORRELATION_ID_HEADER, id);
		} else if (res.header) {
			res.header(CORRELATION_ID_HEADER, id);
		}
		
		next();
	}
}

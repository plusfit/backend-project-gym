/* eslint-disable nestjs/use-dependency-injection */
import { randomUUID } from "node:crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export const CORRELATION_ID_HEADER = "X-Correlation-Id";

// Extend the Express Request interface to include our custom header
declare global {
	namespace Express {
		interface Request {
			[CORRELATION_ID_HEADER]: string;
		}
	}
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const id = randomUUID();
		req[CORRELATION_ID_HEADER] = id;
		res.setHeader(CORRELATION_ID_HEADER, id);
		next();
	}
}

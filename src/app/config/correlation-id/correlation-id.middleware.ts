import { randomUUID } from "node:crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";
import { Connect } from "vite";
import NextFunction = Connect.NextFunction;

export const CORRELATION_ID_HEADER = "X-Correlation-Id";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: NextFunction) {
    const id = randomUUID();
    req[CORRELATION_ID_HEADER] = id;
    res.setHeader(CORRELATION_ID_HEADER, id);
    next();
  }
}

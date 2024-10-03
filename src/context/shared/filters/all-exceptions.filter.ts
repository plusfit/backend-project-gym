import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply } from "fastify";

@Catch() // Captura todas las excepciones
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>(); // Obtén el objeto FastifyReply

    // Determina el estado de la excepción
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    // Log de la excepción
    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)}`,
    );

    // Responde con un mensaje de error estandarizado usando Fastify
    await response.code(status).send({
      success: false,
      data: message,
    });
  }
}

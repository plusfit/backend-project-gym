import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { HttpStatus } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const response = context.switchToHttp().getResponse();

		return next.handle().pipe(
			map((data) => {
				// Solo aplicamos el formato estándar si la respuesta es exitosa (códigos 2xx)
				if (
					response.statusCode >= HttpStatus.OK &&
					response.statusCode < HttpStatus.BAD_REQUEST
				) {
					return {
						success: true,
						data, // La respuesta original del servicio
					};
				}

				// Devolvemos la respuesta tal como está si no es un código exitoso
				return data;
			}),
		);
	}
}

import fastifyCors from "@fastify/cors";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";
import firebaseAdmin from "firebase-admin";

import { AppModule } from "./app/app.module";
import { AllExceptionsFilter } from "@/src/context/shared/filters/all-exceptions.filter";
import { ResponseInterceptor } from "@/src/context/shared/interceptors/response-success.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);

  // Inicializar Firebase Admin
  try {
    firebaseAdmin.initializeApp({
      projectId: configService.get<string>("FIREBASE_PROJECT_ID"),
    });
    const auth = firebaseAdmin.auth();
    console.log(
      "Firebase Admin inicializado correctamente con servicio de auth",
    );
  } catch (error: any) {
    console.error(
      "Firebase Admin ya está inicializado o ocurrió un error:",
      error.message,
    );
  }

  const front_url = configService.get<string>(
    "FRONT_URL",
    "https://frontend-project-gym-v2-test.vercel.app",
  );

  const client_url = configService.get<string>(
    "CLIENT_URL",
    "https://www.plusfit.uy",
  );

  await app
    .getHttpAdapter()
    .getInstance()
    .register(fastifyCors, {
      origin: [
        front_url,
        client_url,
        "http://localhost:4200",
        "http://localhost:8100",
        "http://127.0.0.1:55376",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
      credentials: true,
    });

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle("API")
    .setDescription("API description")
    .setVersion("1.0")
    .addTag("api")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "access-token",
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = configService.get<string>("PORT", "3000");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(port, "0.0.0.0");
}

bootstrap().catch(handleError);

function handleError(error: unknown) {
  // eslint-disable-next-line no-console
  console.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}

process.on("uncaughtException", handleError);

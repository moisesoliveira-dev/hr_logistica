import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ApiExceptionFilter, fail } from "./common/errors.js";

export function setup(app: NestExpressApplication) {
  app.disable("x-powered-by");
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: () => fail(400, "Dados inválidos."),
  }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
}

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { IoAdapter } from "@nestjs/platform-socket.io";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Crash Game — Game Service")
    .setDescription(
      "Engine do jogo: rodadas, apostas, cashout e histórico. " +
        "WebSocket para eventos em tempo real.",
    )
    .setVersion("0.0.1")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Cole apenas o access_token (sem 'Bearer '). Obtenha pelo Keycloak: " +
          "POST http://localhost:8080/realms/crash-game/protocol/openid-connect/token",
      },
      "bearer",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 4001);
  await app.listen(port, "0.0.0.0");
  logger.log(`Games service rodando em :${port} (docs em /docs)`);
}

bootstrap();

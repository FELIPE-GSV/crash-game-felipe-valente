import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Crash Game — Wallet Service")
    .setDescription("API da carteira do jogador. Crédito/débito via RabbitMQ.")
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

  const rabbitUrl = process.env.RABBITMQ_URL;
  if (rabbitUrl) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitUrl],
        queue: process.env.WALLET_QUEUE ?? "wallet.commands",
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 10,
      },
    });
    await app.startAllMicroservices();
    logger.log(`RabbitMQ conectado em ${rabbitUrl}`);
  } else {
    logger.warn("RABBITMQ_URL não definido — microservice não iniciado.");
  }

  const port = Number(process.env.PORT ?? 4002);
  await app.listen(port, "0.0.0.0");
  logger.log(`Wallets service rodando em :${port} (docs em /docs)`);
}

bootstrap();

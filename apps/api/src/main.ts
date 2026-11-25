import "reflect-metadata";
import { config } from "./config.js";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import { setup } from "./setup.js";

// falha logo na partida se faltar configuração obrigatória
void [config.databaseUrl, config.internalKey, config.captchaSecret];

const app = await NestFactory.create<NestExpressApplication>(AppModule);
setup(app);
// no desenvolvimento a API só escuta nesta máquina; no Docker ela fica na rede interna
const host = process.env.API_HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
await app.listen(config.port, host);
new Logger("API").log(`Ouvindo em http://${host}:${config.port}`);

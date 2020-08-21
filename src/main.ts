import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from "dotenv"
import * as cookie from "cookie-parser"


async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().use(cookie())
  await app.listen(3000);
}
bootstrap();

import { Logger, PinoLogger } from "nestjs-pino"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from "dotenv"
import * as cookie from "cookie-parser"
import { env } from "process"
import * as hookshot from "hookshot"
import { spawn } from 'child_process'


async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger)
  app.useLogger(logger)
  const adapter = app.getHttpAdapter();
  adapter.use(cookie())
  adapter.use("/hookshot",
    hookshot('refs/heads/master', function (info) {
      const shell = process.env.SHELL;
      const args = ['-c', "'git pull && npm run build'"];
      logger.log(`ref ${info.ref} was pushed. Run ${shell} with ${args}`)
      spawn(shell, args, { stdio: 'inherit' })
    }))
  const port = env.PORT ? env.port : 3001

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
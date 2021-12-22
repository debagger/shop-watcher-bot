import { Logger } from "nestjs-pino"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from "dotenv"
import * as cookie from "cookie-parser"
import { env } from "process"
import * as hookshot from "hookshot"


async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger))
  const adapter = app.getHttpAdapter();
  adapter.use(cookie())
  adapter.use("/hookshot",
    hookshot('refs/heads/master', 'git pull && npm run build && pm2 restart app')
      .on('push', (info) => console.log('ref ' + info.ref + ' was pushed.')))
  const port = env.PORT ? env.port : 3001

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
import 'core-js/actual/promise'

import { Logger, PinoLogger } from "nestjs-pino"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from "dotenv"
import * as cookie from "cookie-parser"
import { env } from "process"
import * as hookshot from "hookshot"
import { spawn } from 'child_process'

import {ProxyListRootModule} from './proxy-list-root.module'



async function bootstrap() {
  dotenv.config();
  const bootstrapMode = env["BOOTSTRAP_MODE"]

  if(bootstrapMode==="ProxyListOnly"){
    console.log("!!!ProxyListOnly mode!!!")
    bootstrapProxyListOnly()
  }else {
    bootstrapAll()
  }
}

async function bootstrapProxyListOnly() {

  const app = await NestFactory.create(ProxyListRootModule);
  const logger = app.get(Logger)
  app.useLogger(logger)
  const adapter = app.getHttpAdapter();
  const port = env.APP_PORT ? env.APP_PORT : 3001

  await app.listen(port);

  console.log(`Application is running on: ${port}`);
}

async function bootstrapAll() {

  const app = await NestFactory.create(AppModule);
  const logger = app.get(Logger)
  app.useLogger(logger)
  const adapter = app.getHttpAdapter();
  adapter.use(cookie())
  adapter.use("/hookshot",
    hookshot('refs/heads/master', function (info) {
      const shell = process.env.SHELL;
      const args = ['-c', "git pull && npm i && npm run build && cd client/ && npm i && npm run build && cd ../ && pm2 restart all"];
      logger.log(`ref ${info.ref} was pushed. Run ${shell} with ${args}`)
      spawn(shell, args, { stdio: 'inherit', detached: true })
    }))
  const port = env.APP_PORT ? env.APP_PORT : 3001

  await app.listen(port);

  console.log(`Application is running on: ${port}`);
}


bootstrap();
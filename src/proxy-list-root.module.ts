import { Module, RequestMethod } from '@nestjs/common';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ProxyListModule } from './proxy-list/proxy-list.module';
import * as Entities from './entities'
import { env } from 'process'
import { BrowserManagerModule } from './browser-manager/browser-manager.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProxyTesterModule } from './proxy-tester/proxy-tester.module';

const mysqlConfigNames = {
  host: 'MYSQL_HOST',
  port: 'MYSQL_PORT',
  username: 'MYSQL_USERNAME',
  password: 'MYSQL_PASSWORD',
  database: 'MYSQL_DATABASE'
}

type mysqlConfigType = typeof mysqlConfigNames

const getDbConfigs = () => {
  const config: any = {}
  const notFound = []
  Object.keys(mysqlConfigNames).forEach(key => {
    const envVarName = mysqlConfigNames[key]
    const value = env[envVarName]
    if (value) {
      config[key] = value
    }
    else {
      notFound.push(envVarName)
    }
  })
  config.port = Number(config.port)
  if (notFound.length > 0) {
    console.log(`${notFound.join(', ')} environment variables must be defined.`)
    return process.exit(1)
  } else {
    if (!Number.isInteger(config.port)) {
      console.log(`MYSQL_PORT environment variable must be an integer.`)
      return process.exit(1)
    }
    console.log("Database config:")
    console.table(config);
    return config
  }
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      ...getDbConfigs(),
      entities: Object.values(Entities),
      synchronize: true,
      // maxQueryExecutionTime: 1000,
      // logging: true,
      // logger: "file"
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client/dist/spa'),
      exclude:["/graphql"]
    }),
    LoggerModule.forRoot({exclude:[{method:RequestMethod.ALL, path:'/graphql'}]}),
    ConfigModule.forRoot(),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      installSubscriptionHandlers: true,
    }),
    ProxyListModule,
    BrowserManagerModule],
})
export class ProxyListRootModule { }

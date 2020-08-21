import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import * as dotenv from "dotenv"
import { ConfigModule } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";

dotenv.config()

@Module({
  imports: [ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: (() => {
        return process.env.JWT_SECRET;
      })(),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

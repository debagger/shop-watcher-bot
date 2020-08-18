import { Controller, Get, Query } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Controller("auth")
export class AuthController {
    constructor(private jwt: JwtService){

    }

  @Get("/login")
  login(@Query("token") token: string) {
      return this.jwt.decode(token);
  }
}

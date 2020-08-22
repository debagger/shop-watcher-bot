import { Controller, Get, Query, Res, UseGuards, Req, Post, Body } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthRequest } from "./auth-request.interface";

@Controller("auth")
export class AuthController {
  constructor(private jwt: JwtService) {}

  @Post("/login")
  login(@Body("token") token: string, @Res() res) {
    console.log("token = ",token);
    res.cookie('jwt', token, { maxAge: 900000, httpOnly: true });
    return res.send(this.jwt.decode(token));
  }

  @UseGuards(JwtAuthGuard)
  @Get("/me")
  me(@Req() req:AuthRequest) {
    return req.user;
  }
}

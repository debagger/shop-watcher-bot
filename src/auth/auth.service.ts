import { Injectable, Get, Query } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  encodePayload(payload: string) {
    return this.jwt.sign(payload);
  }
}

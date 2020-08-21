import { type } from "os";
import { Request } from "express";
import { Chat, User } from "telegraf/typings/telegram-types";
export interface AuthRequest extends Request {
  user: { chat: Chat; user: User };
}

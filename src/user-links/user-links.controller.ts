import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { AuthRequest } from "src/auth/auth-request.interface";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ChatDataService } from "src/chat-data/chat-data.service";

@Controller("user-links")
export class UserLinksController {
  constructor(private chatData: ChatDataService) {}
  
  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@Req() req: AuthRequest) {
    const chatId = req.user.chat.id;
    const chat = await this.chatData.getChat(chatId);
    return { chatId, ...chat.links };
  }
}

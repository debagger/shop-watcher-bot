import { Controller, Get, UseGuards, Req, Post, Body, NotFoundException, BadRequestException } from "@nestjs/common";
import { AuthRequest } from "src/auth/auth-request.interface";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { UserLinksService } from "./user-links.service";

@Controller("user-links")
export class UserLinksController {
  constructor(private chatData: UserLinksService) {}
  
  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@Req() req: AuthRequest) {
    const chatId = req.user.chat.id;
    const links = await this.chatData.getLinks(chatId);
    return links;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async post(@Body("link") link:string, @Req() req:AuthRequest){
    const chatId = req.user.chat.id;
    const res = await this.chatData.addNewLink(chatId, link);
    if(res instanceof Error) throw new BadRequestException(res.message)
    return res

  }
}

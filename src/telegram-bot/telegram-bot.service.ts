import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Telegraf } from "telegraf";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TelegramBotService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  private readonly API_KEY = this.configService.get<string>(
    "TELEGRAM_BOT_API_KEY"
  );

  /**
   * botInit
   */
  public async botInit() {
    const bot = new Telegraf(this.API_KEY);
    bot.start((ctx) =>
      ctx.reply(
        "Отправьте мне ссылку на страничку zara.com и я буду отслеживать появление размеров в продаже."
      )
    );

    bot.help((ctx) =>
      ctx.reply(
        "Отправьте мне ссылку на страничку zara.com и я буду отслеживать появление размеров в продаже."
      )
    );
    await bot.launch();
    console.log("Bot started")
  }

  public async onModuleInit() {
    await this.botInit();
  }
}

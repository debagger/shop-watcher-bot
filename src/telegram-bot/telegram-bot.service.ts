import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Telegraf, Context, Markup } from "telegraf";
import { ConfigService } from "@nestjs/config";
import { ChatDataService } from "../chat-data/chat-data.service";
import { Link } from "../file-db/chat-links.interface";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { createHash } from "crypto";
import { CallbackButton } from "telegraf/typings/markup";
import { IEventHandler, EventsHandler } from "@nestjs/cqrs";
import { NewSizeExist } from "../link-scanner/new-size-exist.event";

@Injectable()
@EventsHandler(NewSizeExist)
export class TelegramBotService
  implements OnModuleInit, IEventHandler<NewSizeExist> {
  constructor(
    private config: ConfigService,
    private chat: ChatDataService,
    private spider: SiteCrawlerService
  ) {}

  async handle(event: NewSizeExist) {
    const { telegram } = this.botInstance;
    const { chatId, link, newSizes } = event;
    await telegram.sendMessage(chatId, link);
    await telegram.sendMessage(chatId, `Есть размеры: ${newSizes.join(", ")}`);
  }

  private readonly API_KEY = this.config.get<string>("TELEGRAM_BOT_API_KEY");

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

    bot.hears(/https:\/\/www.zara.com\//, async (ctx) => {
      if (!ctx.message) return;
      const message = ctx.message;
      if (!message.text) return;
      const text = message.text;
      const chatId = message.chat.id;
      const chat = await this.chat.getChat(chatId);

      const link = text.split("?")[0];
      const links = chat.links;

      let linkData = links[link] as Link;

      if (!linkData) {
        linkData = {};
      }

      const res = await this.spider.getData(link);

      if (res && res.name && res.sizes.length > 0) {
        if (!links[link]) {
          links[link] = linkData;
        }

        linkData.lastCheckResult = res;

        const msg = `
Размерный ряд: 
${res.sizes.map((i) => `${i.disabled ? "❌" : "✅"} ${i.size}`).join("\n")}
Напишите за каким следить?
    `;

        const keyboard = Markup.inlineKeyboard(
          res.sizes.map((i) => Markup.callbackButton(i.size, "size:" + i.size))
        )
          .resize()
          .extra();

        ctx.reply(msg, keyboard);
        links.lastLink = link;
      } else {
        ctx.reply("Не могу проверить размеры, что-то пошло не так");
      }
    });

    bot.action(/size:(.+)/, async (ctx) => {
      if (!ctx.chat) return;
      if (!ctx.match) return;
      const chat = await this.chat.getChat(ctx.chat.id);
      const selectedSize = ctx.match[1];
      const links = chat.links;
      if (links.lastLink) {
        const curLink = links[links.lastLink] as Link;
        const foundSize = curLink.lastCheckResult?.sizes.find(
          (i) => i.size == selectedSize
        );
        if (foundSize) {
          if (!curLink.trackFor) {
            curLink.trackFor = [];
          }
          curLink.trackFor.push(foundSize.size);
          curLink.trackFor = Array.from(new Set(curLink.trackFor));
          return await ctx.reply(
            `ОК. Я буду следить за ${curLink.trackFor.join(", ")}`
          );
        } else {
          return await ctx.reply("Такого размера нет");
        }
      }
    });

    bot.hears("Показать все", async (ctx) => {
      if (!ctx.chat) return;
      const chat = await this.chat.getChat(ctx.chat.id);
      const links = chat.links;
      const zaraLinks = Object.keys(links).filter((i) =>
        i.startsWith("https://www.zara.com/")
      );
      if (zaraLinks.length < 1)
        return ctx.reply(
          "Пока я не отслеживаю ни одной позиции. Если хочешь, пришли мне ссылку на zara.com и я буду следить за размерами."
        );
      for (const link of zaraLinks) {
        const md4 = createHash("md4")
          .update(link)
          .digest("hex");
        let buttons: CallbackButton[] | CallbackButton[][] = [
          Markup.callbackButton("Удалить ❌", "delete:" + md4),
        ];
        const linkData = links[link] as Link;
        if (linkData.trackFor) {
          buttons = [
            buttons,
            linkData.trackFor.map((i) =>
              Markup.callbackButton(`❌ ${i}`, `deleteSize:${md4}:[${i}]`)
            ),
          ];
        }
        const keyboard = Markup.inlineKeyboard(buttons)
          .resize()
          .extra();
        await ctx.reply(link, keyboard);
      }
    });

    bot.action(/delete:(.+)/, async (ctx) => {
      if (!ctx.chat) return;
      if (!ctx.match) return;
      const chat = await this.chat.getChat(ctx.chat.id);
      const links = chat.links;
      const md4 = ctx.match[1];

      const link = Object.keys(links).find(
        (link) =>
          md4 ===
          createHash("md4")
            .update(link)
            .digest("hex")
      );

      if (link && chat.links[link]) {
        delete chat.links[link];
        try {
          await ctx.answerCbQuery(`Удалил`);
        } catch (err) {}
      } else {
        try {
          await ctx.answerCbQuery(`Не нашел чего удалять`);
        } catch (err) {}
      }
    });

    bot.action(/deleteSize:(.+):\[(.+)\]/, async (ctx) => {
      if (!ctx.chat) return;
      if (!ctx.match) return;

      const chat = await this.chat.getChat(ctx.chat.id);
      const links = chat.links;
      const md4 = ctx.match[1];
      const size = ctx.match[2];
      const link = Object.keys(links).find(
        (link) =>
          md4 ===
          createHash("md4")
            .update(link)
            .digest("hex")
      );

      if (!link) {
        try {
          return ctx.answerCbQuery("Не нашел такую ссылку");
        } catch (err) {
          return;
        }
      }
      const linkData = links[link] as Link;
      const trackSizes = linkData.trackFor;

      if (!(trackSizes && trackSizes.includes(size))) {
        try {
          return ctx.answerCbQuery("Не нашел такой размер");
        } catch (err) {
          return;
        }
      } else {
        linkData.trackFor = trackSizes.filter((i) => i !== size);
      }

      try {
        await ctx.answerCbQuery(`Удалил`);
      } catch (err) {
        return;
      }
    });

    await bot.launch();
    console.log("Bot started");
    return bot;
  }

  public botInstance: Telegraf<Context>;

  public async onModuleInit() {
    this.botInstance = await this.botInit();
  }
}

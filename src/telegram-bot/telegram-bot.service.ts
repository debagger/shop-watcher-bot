import { Injectable, OnModuleInit } from "@nestjs/common";
import { Telegraf, Context, Markup } from "telegraf";
import { ConfigService } from "@nestjs/config";
import { ChatDataService } from "../chat-data/chat-data.service";
import { ChatLinks, LinkCheckResultMulticolors, MulticolorLink, TrackItem } from "../chat-data-storage/chat-links.interface";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { createHash } from "crypto";
import { IEventHandler, EventsHandler } from "@nestjs/cqrs";
import { NewSizeExist } from "../link-scanner/new-size-exist.event";
import { AuthService } from "../auth/auth.service";
import { PinoLogger } from "nestjs-pino";

@Injectable()
@EventsHandler(NewSizeExist)
export class TelegramBotService
  implements OnModuleInit, IEventHandler<NewSizeExist> {
  constructor(
    private config: ConfigService,
    private chatDataStorage: ChatDataService,
    private spider: SiteCrawlerService,
    private authService: AuthService,
    private readonly logger: PinoLogger
  ) { }

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

  private callbackHashtable: Record<string, { message: any, timestamp: Date }> = {}

  private putCallback(message: any): string {



    const md4 = createHash("md4")
      .update(JSON.stringify(message))
      .digest("hex");

    this.callbackHashtable[md4] = { message, timestamp: new Date() }

    return md4
  }

  private getCallback(md4: string) {
    const message = this.callbackHashtable[md4]?.message
    return message
  }

  public async botInit() {
    const bot = new Telegraf(this.API_KEY);
    const keyboard = Markup.keyboard(["Показать все"])
      .resize();
    bot.start((ctx) =>
      ctx.reply(
        "Отправьте мне ссылку на страничку zara.com и я буду отслеживать появление размеров в продаже.",
        keyboard
      )
    );

    bot.help(async (ctx) => {
      await ctx.reply(
        `http://localhost:3000/auth/login?token=${this.authService.encodePayload(
          JSON.stringify({ user: ctx.from, chat: ctx.chat })
        )}`,
        keyboard
      );
      const key = this.authService.encodePayload(
        JSON.stringify({ user: ctx.from, chat: ctx.chat })
      );
      ctx.replyWithMarkdown(
        `Это сайт, на котором вы можете посмотреть ссылки [Сайт](http://debagger.ru:3000/auth/login?key=${key})`
      );
    });

    bot.hears(/https:\/\/www.zara.com\//, async (ctx) => {
      if (!ctx.message) return;
      const message = ctx.message;
      if (!message.text) return;
      const text = message.text;
      const chatId = message.chat.id;
      let link
      try {
        const url = new URL(text);
        const keyToDelete: string[] = [];

        //for example this https://www.zara.com/RU/ru/...longpath...-p07901432.html?v1=120500928&utm_campaign=productShare&utm_medium=mobile_sharing_Android&utm_source=red_social_movil
        //Look like only v1 and maybe v2 and so on has affect for resulted page than remove other keys

        url.searchParams.forEach((_, key) => {
          if (!/v\d+/.test(key)) keyToDelete.push(key)
        })

        //delete other keys
        keyToDelete.forEach(key => url.searchParams.delete(key))

        //sort for uniformity
        url.searchParams.sort();
        link = url.toString()
      }
      catch (err) {
        ctx.reply("Это какая-то неправильная ссылка");
        return;
      }


      this.spider.getData(link).then((res) => {
        if (res && res.name && res.colors.length > 0) {
          return this.sendLinkResult(chatId, link, res);
        }

      }).catch(err => {
        const { telegram } = this.botInstance
        telegram.sendMessage(chatId, `Произошла ошибка при загрузке ссылки \n ${link}`)
      });

      ctx.reply("Начал загрузку информации по данной позиции")


    });

    bot.action(/size:(.+)/, async (ctx) => {
      if (!ctx.chat) return;
      if (!ctx.match) return;
      const chat = await this.chatDataStorage.getChat(ctx.chat.id);
      const selectedSize = this.getCallback(ctx.match[1]);
      if (!selectedSize) {
        await ctx.reply("Что-то пошло не так")
        return
      }
      const links = chat.links;
      if (links) {
        const curLink = <MulticolorLink>chat.links[selectedSize.link];

        const foundColor = curLink.lastCheckResult?.colors.find(c => c.color.name === selectedSize.colorName);
        if (!foundColor) {
          await ctx.reply("Такой размер не найден")
          return;
        }
        const foundSize = foundColor.sizes.find(
          (i) => i.size == selectedSize.size
        );
        if (foundSize) {
          if (!curLink.trackFor) {
            curLink.trackFor = [];
          }
          const newTrackItem: TrackItem = { color: foundColor.color.name, size: foundSize.size };

          if (!(<TrackItem[]>curLink.trackFor).find(i => i.size === newTrackItem.size && i.color === newTrackItem.color)) {
            (<TrackItem[]>curLink.trackFor).push(newTrackItem)
          }

          const trackItems = (<TrackItem[]>curLink.trackFor);
          const trackColorNames = new Set(trackItems.map(i => i.color))
          let msg = "ОК. Я буду следить за:\n"

          for (let colorName of trackColorNames) {
            msg += `Цвет: ${colorName}. `
            const colorSizes = trackItems.filter(i => i.color === colorName).map(i => i.size)
            msg += `Размеры: ${colorSizes.join(", ")}\n`
          }
          return await ctx.reply(msg);
        } else {
          return await ctx.reply("Такого размера нет");
        }

      }
    }
    );




    bot.hears("Показать все", async (ctx) => {
      if (!ctx.chat) return;
      ctx.chat.type
      const chat = await this.chatDataStorage.getChat(ctx.chat.id);
      const links = chat.links;
      const zaraLinks = Object.keys(links).filter((i) =>
        i.startsWith("https://www.zara.com/")
      );
      if (zaraLinks.length < 1)
        return ctx.reply(
          "Пока я не отслеживаю ни одной позиции. Если хочешь, пришли мне ссылку на zara.com и я буду следить за размерами."
        );
      for (const link of zaraLinks) {
        const deleteButton =
          Markup.button.callback("Удалить ❌", `delete:${this.putCallback(link)}`);

        const linkData = links[link] as MulticolorLink;

        const buttons = [[deleteButton]];
        if (linkData.trackFor) {
          const sizeButton = linkData.trackFor.map((trackItem) =>
            [Markup.button.callback(`❌ ${trackItem.color + ': ' + trackItem.size}`, `deleteSize:${this.putCallback({ link, size: trackItem.size, color: trackItem.color })}`)]
          )

          buttons.push(...sizeButton);
        }
        const keyboard = Markup.inlineKeyboard(buttons);
        try {
          const result = await ctx.reply(link, keyboard);
        } catch (error) {
          this.logger.error(error)
        }

      }
    });

    bot.action(/delete:(.+)/, async (ctx) => {
      if (!ctx.chat) return;
      if (!ctx.match) return;
      const chat = await this.chatDataStorage.getChat(ctx.chat.id);
      const links = chat.links;
      const md4 = ctx.match[1];

      const link = this.getCallback(md4);

      if (link && chat.links[link]) {
        delete chat.links[link];
        try {
          await ctx.answerCbQuery(`Удалил`);
        } catch (err) { }
      } else {
        try {
          await ctx.answerCbQuery(`Не нашел чего удалять`);
        } catch (err) { }
      }
    });

    bot.action(/deleteSize:(.+)/, async (ctx) => {
      if (!ctx.chat) return;
      if (!ctx.match) return;

      const chat = await this.chatDataStorage.getChat(ctx.chat.id);
      const links = chat.links;
      const sizeHash = ctx.match[1];
      const callback = this.getCallback(sizeHash) as { link: string; size: string, color?: string }
      if (!callback) {
        try {
          return ctx.answerCbQuery("Что-то пошло не так...");
        } catch (err) {
          return;
        }
      }

      const { link, size, color } = callback

      if (!link) {
        try {
          return ctx.answerCbQuery("Не нашел такую ссылку");
        } catch (err) {
          return;
        }
      }
      const linkData = links[link] as MulticolorLink;

      const trackSizes = linkData.trackFor;
      if (trackSizes.find(i => i.color === color && i.size === size)) {
        linkData.trackFor = trackSizes.filter(i => !(i.size === size && i.color === color))
        try {
          return await ctx.answerCbQuery(`Удалил`);
        } catch (err) {
          console.error(err);
          return;
        }
      }


    });

    await bot.launch();
    console.log("Bot started");
    return bot;
  }

  public botInstance: Telegraf<Context>;

  private async sendLinkResult(chatId: number, link: string, res: LinkCheckResultMulticolors) {
    const chat = await this.chatDataStorage.getChat(chatId)
    const links = chat.links;
    let linkData: any = links[link];

    if (!linkData) {
      linkData = {};
    }

    linkData.type = 'multicolorLink';
    if (!links[link]) {
      links[link] = linkData;
    }

    linkData.lastCheckResult = res;
    for (const color of res.colors) {
      const msg = `
${color.color.name}
Размерный ряд: 
${color.sizes.map((i) => `${i.disabled ? "❌" : "✅"} ${i.size}`).join("\n")}
Напишите за каким следить?
    `;
      const buttons = color.sizes.map((i) => Markup.button.callback(i.size, "size:" + this.putCallback({ link, colorName: color.color.name, size: i.size })));
      const keyboard = Markup.inlineKeyboard(buttons);

      const { telegram } = this.botInstance;
      await telegram.sendMessage(chatId, msg, keyboard);
    }
    links.lastLink = link;
    return;
  }

  public async onModuleInit() {
    this.botInstance = await this.botInit();
  }
}

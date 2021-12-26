import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { ChatDataService } from "../chat-data/chat-data.service";
import { MulticolorLink, Size, TrackItem, Color } from "../chat-data-storage/chat-links.interface";
import { EventBus } from "@nestjs/cqrs";
import { NewSizeExist } from "./new-size-exist.event";
import { LinkGenerator } from "./link-generator.provider";
import { boolean } from "fp-ts";

const sleep = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

@Injectable()
export class LinkScannerService implements OnApplicationBootstrap {
  constructor(
    private Chat: ChatDataService,
    private spider: SiteCrawlerService,
    private linkGenerator: LinkGenerator,
    private eventBus: EventBus
  ) { }

  async onApplicationBootstrap() {
    await this.runCheckAll();
  }

  async runCheckAll() {
    const checkAll = async () => {
      for await (const { chatId, link } of this.linkGenerator) {
        try {
          await this.checkLink(link, chatId);
        } catch (error) {

        }
      }
    }
    setTimeout(checkAll, 1000);
  }

  async checkLink(link: string, chatId: number) {
    const newData = await this.spider.getData(link);
    console.log(newData.name);
    const chat = await this.Chat.getChat(chatId);
    const links = chat.links;
    if (newData) {

      const linkData = links[link] as MulticolorLink;

      const oldState = linkData.trackFor.reduce((acc, trackItem) => {
        const color = linkData.lastCheckResult.colors.find(i => i.color.name === trackItem.color)
        if (color) {
          const oldSize = color.sizes.find(i => i.size === trackItem.size)
          if (oldSize) {
            acc.set(trackItem, { size: oldSize, color: color.color })
          }
        }
        return acc
      }, new Map<TrackItem, { size: Size, color: Color }>())

      const newState = linkData.trackFor.reduce((acc, trackItem) => {
        const color = newData.colors.find(i => i.color.name === trackItem.color)
        if (color) {
          const newSize = color.sizes.find(i => i.size === trackItem.size)
          if (newSize) {
            acc.set(trackItem, { size: newSize, color: color.color })
          }
        }
        return acc
      }, new Map<TrackItem, { size: Size, color: Color }>())

      const sizeExist = linkData.trackFor
        .map(trackItem => ({ trackItem, old: oldState.get(trackItem), new: newState.get(trackItem) }))
        .filter(item => item.new && item.new.size && !item.new.size.disabled && item.old?.size?.disabled)
        .map(i => `${i.new.color.name}: ${i.new.size.size}`)

      if (sizeExist.length > 0) {
        this.eventBus.publish(new NewSizeExist(chatId, link, sizeExist));
      }

      linkData.lastCheckResult = newData;
    }

  }

}

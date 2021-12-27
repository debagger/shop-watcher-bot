import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { ChatDataService } from "../chat-data/chat-data.service";
import { MulticolorLink, Size, TrackItem, Color, LinkCheckResultMulticolors } from "../chat-data-storage/chat-links.interface";
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

  isItemReturnOnSale(trackItem: TrackItem, previousResult: LinkCheckResultMulticolors, newResult: LinkCheckResultMulticolors) {
    const prevSize = previousResult.colors?.find(i => i.color.name === trackItem.color)?.sizes?.find(s => s.size === trackItem.size)
    const prevIsNotExist = !(typeof prevSize?.disabled === 'boolean')
    const newSize = newResult.colors?.find(i => i.color.name === trackItem.color)?.sizes?.find(s => s.size === trackItem.size)
    const newIsExist = typeof newSize?.disabled === 'boolean'

    return  (prevIsNotExist || prevSize.disabled) && newIsExist && (newSize.disabled === false)
  }

  public getItemsWhichReturnOnSale(trackFor: TrackItem[], prevData: LinkCheckResultMulticolors, newData: LinkCheckResultMulticolors) {
    return trackFor.filter(t => this.isItemReturnOnSale(t, prevData, newData)).map(i => `${i.color}: ${i.size}`);
  }

  async checkLink(link: string, chatId: number) {
    const newData = await this.spider.getData(link);

    const chat = await this.Chat.getChat(chatId);
    const linkData = <MulticolorLink>chat.links[link];
    const prevData = linkData.lastCheckResult
    const trackFor = linkData.trackFor
    const sizesExist = this.getItemsWhichReturnOnSale(trackFor, prevData, newData)
    if (sizesExist && sizesExist.length > 0) {
      console.log(`Is on sale now: ${linkData.lastCheckResult.name}, sizes: ${sizesExist.join(", ")}`)
      this.eventBus.publish(new NewSizeExist(chatId, link, sizesExist));
    }
    linkData.lastCheckResult = newData;
  }



}


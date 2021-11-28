import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { SiteCrawlerService } from "../site-crawler/site-crawler.service";
import { ChatDataService } from "../chat-data/chat-data.service";
import { Link, LinkCheckResultSimple } from "../file-db/chat-links.interface";
import { EventBus } from "@nestjs/cqrs";
import { NewSizeExist } from "./new-size-exist.event";
import { LinkGenerator } from "./link-generator.provider";

const sleep = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

@Injectable()
export class LinkScannerService implements OnApplicationBootstrap {
  constructor(
    private Chat: ChatDataService,
    private spider: SiteCrawlerService,
    private linkGenerator: LinkGenerator,
    private eventBus: EventBus
  ) {}

  async onApplicationBootstrap() {
    await this.runCheckAll();
  }

  async runCheckAll() {
    const checkAll = async () => {
      for await(const {chatId, link} of this.linkGenerator){
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
    if (newData && newData.type==="simple") {
      
      const linkData = links[link] as Link;
      if (
        linkData.lastCheckResult &&
        linkData.trackFor &&
        linkData.trackFor.length > 0
      ) {
        
        const sizeExist = this.newSizes(linkData, newData);
        if (sizeExist.length > 0) {
          this.eventBus.publish(new NewSizeExist(chatId, link, sizeExist));
        }
      }
      linkData.lastCheckResult = newData;
    }
  }

  private newSizes(linkData: Link, newData: LinkCheckResultSimple) {
    const oldSizeExist = linkData.lastCheckResult.sizes
      .filter((s) => linkData.trackFor?.includes(s.size) && !s.disabled)
      .map((s) => s.size);

    const sizeExist = newData.sizes
      .filter(
        (s) =>
          !oldSizeExist.includes(s.size) &&
          linkData.trackFor?.includes(s.size) &&
          !s.disabled
      )
      .map((s) => s.size);
    return sizeExist;
  }
}

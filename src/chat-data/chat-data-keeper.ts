import { FileDbService } from "../file-db/file-db.service";
import { ChatLinks } from "../file-db/chat-links.interface";
import { link, linkSync } from "fs";

export class Chat {
  constructor(private chatId: Number, private db: FileDbService) {
  }

  private _links: ChatLinks = {};

  set links(links: ChatLinks) {
    this._links = links;
  }

  get links() {
    return this._links;
  }

  async save() {
    await this.db.saveChatLinks(this.chatId, this.links);
  }


}

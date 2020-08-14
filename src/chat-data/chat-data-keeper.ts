import { FileDbService } from "../file-db/file-db.service";
import { ChatLinks } from "../file-db/chat-links.interface";

export class Chat {
  constructor(private chatId: Number, private db: FileDbService) {}

  async load() {
    this._links = await this.db.getChatLinks(this.chatId);
  }
  private _links: ChatLinks = {};

  get links() {
    console.log(`Get links for chat id = ${this.chatId}`);
    return this.proxify<ChatLinks>(this._links);
  }

  private lastSave: Promise<void> = Promise.resolve();

  private proxify<T extends Object>(obj: T) {
    return new Proxy<T>(obj, {
      get: this.getHandler.bind(this),
      set: this.setHandler.bind(this),
      deleteProperty: this.deleteHandler.bind(this),
    });
  }

  private deleteHandler(target: any, key: string | number | symbol) {
    delete target[key];
    this.lastSave.finally(() => {
      this.lastSave = this.save().finally(() =>
        console.log(`Chat id=${this.chatId} saved`)
      );
    });
    return true;
  }

  private setHandler(target: any, key: string | number | symbol, value: any) {
    target[key] = value;
    this.lastSave.finally(() => {
      this.lastSave = this.save().finally(() =>
        console.log(`Chat id=${this.chatId} saved`)
      );
    });
    return true;
  }

  private getHandler(target: any, key: string | number | symbol) {
    const value = target[key];
    if (typeof value === "object") return this.proxify(value);
    return value;
  }

  private async save() {
    await this.db.saveChatLinks(this.chatId, this.links);
  }
}

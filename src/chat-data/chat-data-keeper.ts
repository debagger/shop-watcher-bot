import { ChatDataFileStorageService } from "../chat-data-storage/file-storage.service";
import { ChatLinks } from "../chat-data-storage/chat-links.interface";
import { ChatDataDBStorageService } from "src/chat-data-storage/db-storage.service";

export class Chat {
  constructor(private chatId: number, private db: ChatDataDBStorageService) {}

  async load() {
    this._links = await this.db.getChatLinks(this.chatId);

    const keys = Object.keys(this._links).filter(key=>key.startsWith("https://www.zara.com"))

    keys.forEach(key=>{
      if((<any>this._links[key]).type) return
      (<any>this._links[key]).type =  "simpleLink"
    })

  }
  private _links: ChatLinks = {};

  get links() {
    console.log(`Get links for chat id = ${this.chatId}`);
    return this.proxify<ChatLinks>(this._links);
  }

  private lastSave: Promise<void> = Promise.resolve();

  private readonly proxyHandlers = {
    get: this.getHandler.bind(this),
    set: this.setHandler.bind(this),
    deleteProperty: this.deleteHandler.bind(this),
  };

  private proxify<T extends Object>(obj: T) {
    return new Proxy<T>(obj, this.proxyHandlers);
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

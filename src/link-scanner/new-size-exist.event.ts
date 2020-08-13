export class NewSizeExist {
  constructor(
    public readonly chatId: number,
    public readonly link: string,
    public readonly newSizes: string[]
  ) {}
}

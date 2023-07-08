import {
  Parent,
  Query,
  ResolveField,
  Resolver,
  Args,
  Int,
} from "@nestjs/graphql";
import { InjectRepository } from "@nestjs/typeorm";
import { TelegramChatDialog, TelegramChatUser } from "../entities";
import { Repository } from "typeorm";

@Resolver((type) => TelegramChatUser)
export class TelegramChatUserResolver {
  constructor(
    @InjectRepository(TelegramChatUser)
    private readonly telegramChatUserRepo: Repository<TelegramChatUser>,
    @InjectRepository(TelegramChatDialog)
    private readonly telegramChatDialogRepo: Repository<TelegramChatDialog>
  ) {}

  @Query((returns) => [TelegramChatUser])
  async telegramUsers() {
    return await this.telegramChatUserRepo.find({ order: { username: "ASC" } });
  }

  @Query((returns) => TelegramChatUser)
  async telegramUser(@Args("userId", { type: () => Int }) userId: number) {
    return await this.telegramChatUserRepo.findOne({ where: { id: userId } });
  }

  @ResolveField((type) => [TelegramChatDialog])
  async dialogs(
    @Parent() user: TelegramChatUser,
    @Args("take", { type: () => Int }) take: number,
    @Args("skip", { type: () => Int }) skip: number
  ) {
    return this.telegramChatDialogRepo.find({
      where: { from: { id: user.id } },
      order: { id: "DESC" },
      take,
      skip,
      relations: ["answers"],
    });
  }
}

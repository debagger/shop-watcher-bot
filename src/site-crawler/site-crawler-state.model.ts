import { Field, ObjectType } from '@nestjs/graphql';


@ObjectType()
export class SiteCrawlerState {
  @Field(type=> [String])
  pendingRequests: string[];
}
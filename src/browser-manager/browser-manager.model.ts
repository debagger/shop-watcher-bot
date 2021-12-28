import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class BrowserManagerModel {
    @Field(type => [KnownHostModel])
    knownHosts: KnownHostModel[]
}

@ObjectType()
export class KnownHostModel {
    @Field()
    hostName: string

    @Field(type => [String], { nullable: true })
    proxiesBlackList?: string[]

    @Field(type => [BestProxyItemModel], { nullable: true })
    proxiesBestList?: BestProxyItemModel[]
}

@ObjectType()
export class BestProxyItemModel {
    @Field()
    proxyAddress: string

    @Field(type => Number)
    rating: number
}



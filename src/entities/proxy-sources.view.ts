import { Field, ObjectType } from "@nestjs/graphql";
import { JoinColumn, ManyToOne, ViewColumn, ViewEntity } from "typeorm";
import { ProxyListSource, ProxyListUpdate } from ".";

@ObjectType()
@ViewEntity({expression:`
select plu.sourceId, plu_p.proxyId, MIN(plu.id) firstUpdateId, MAX(plu.id) lastUpdateId
from proxy_list_update plu
inner join proxy_list_update_loaded_proxies_proxy plu_p on plu.id=plu_p.proxyListUpdateId
group by plu.sourceId, plu_p.proxyId
`})
export class ProxySourcesView{

    @ViewColumn()
    proxyId:number

    @ViewColumn()
    sourceId: number
    
    @Field((type) => ProxyListSource)
    @ManyToOne(type=>ProxyListSource)
    @JoinColumn({name:'sourceId', referencedColumnName:'id'})
    source:ProxyListSource

    @ViewColumn()
    firstUpdateId:number

    @Field((type) => ProxyListUpdate)
    @ManyToOne(type=>ProxyListUpdate)
    @JoinColumn({name:'firstUpdateId', referencedColumnName:'id'})
    firstUpdate:ProxyListUpdate

    @ViewColumn()
    lastUpdateId:number
    
    @Field((type) => ProxyListUpdate)
    @ManyToOne(type=>ProxyListUpdate)
    @JoinColumn({name:'lastUpdateId', referencedColumnName:'id'})
    lastUpdate:ProxyListUpdate
}
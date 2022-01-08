import { ObjectType, Field, Int } from "@nestjs/graphql";

@ObjectType()
export class Pagination {
  @Field(type=>Int)
  page: number;
  @Field(type=>Int)
  rowsPerPage: number;
  @Field(type=>Int)
  rowsNumber: number;
}

export interface IPagination<T> {
  pagination: Pagination;
}

@ObjectType({isAbstract:true})
export abstract class Paginated<T> implements IPagination<T> {
  @Field((type) => Pagination)
  pagination: Pagination;

  abstract rows:T[]

}

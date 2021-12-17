import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ObjectStorageSharedString{

    @PrimaryGeneratedColumn()
    id:number

    @Column({unique:true})
    value:string
}
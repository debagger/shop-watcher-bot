import { field } from "fp-ts";
import { type } from "os";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ObjectStorageField } from ".";

@Entity()
export class ObjectStorageObject {
    @PrimaryGeneratedColumn()
    id:number

    @Column({default:false})
    isArray:boolean

    @OneToMany(type=>ObjectStorageField, field=>field.owner, {cascade:true, eager: true})
    fields:ObjectStorageField[]


}
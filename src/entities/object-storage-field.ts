import { Column, Entity, JoinColumn, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ObjectStorageObject } from "./object-storage-object";
import { ObjectStorageSharedString } from "./object-storage-shared-string";

@Entity()
export class ObjectStorageField {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(type => ObjectStorageSharedString, { nullable: true, eager: true })
    keyString?: ObjectStorageSharedString

    @Column({ nullable: true })
    keyNumber?: number

    @Column({ nullable: true })
    dateValue?: Date

    @Column({ nullable: true })
    numberValue?: number

    @ManyToOne(type => ObjectStorageSharedString, { nullable: true, cascade: true, eager: true })
    stringValue?: ObjectStorageSharedString

    @Column({ nullable: true })
    isNull?: boolean

    @Column({ nullable: true })
    booleanValue?: boolean

    @ManyToOne(type => ObjectStorageObject, { nullable: true })
    objectValue?: ObjectStorageObject

    @ManyToOne(type => ObjectStorageObject, obj => obj.fields)
    owner: ObjectStorageObject
}
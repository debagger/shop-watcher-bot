import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectStorageField, ObjectStorageObject, ObjectStorageSharedString } from '../../entities';
import { DeepPartial, EntityManager, Repository, Transaction, TransactionManager } from 'typeorm';

@Injectable()
export class ObjectStorageService {
    constructor(
        @InjectRepository(ObjectStorageObject) private objectsRepo: Repository<ObjectStorageObject>,
        @InjectRepository(ObjectStorageField) private fieldsRepo: Repository<ObjectStorageField>,
        @InjectRepository(ObjectStorageSharedString) private sharedStringRepo: Repository<ObjectStorageSharedString>
    ) {

    }

    private async getSharedString(str: string, manager: EntityManager) {
        const sharedStringsRepo = manager.getRepository<ObjectStorageSharedString>(ObjectStorageSharedString)
        let sharedString = await sharedStringsRepo.findOne({ value: str })
        if (sharedString) return sharedString
        return await sharedStringsRepo.save({ value: str })
    }

    private async makeDbObject(o: object | any[], manager: EntityManager): Promise<ObjectStorageObject> {

        const setFieldValue = async (field: DeepPartial<ObjectStorageField>, value: any) => {
            switch (typeof value) {
                case 'number': {
                    field.numberValue = value
                    break
                }
                case 'string': {
                    field.stringValue = await this.getSharedString(value, manager)
                    break
                }
                case 'boolean': {
                    field.booleanValue = value
                    break
                }
                case 'object': {
                    if (value === null) {
                        field.isNull = true
                        break
                    }
                    if (value instanceof Date) {
                        field.dateValue = value
                        break
                    }
                    field.objectValue = await this.makeDbObject(value, manager)
                    break
                }
            }
        }

        const objectsRepo = manager.getRepository<ObjectStorageObject>(ObjectStorageObject)
        const fieldsRepo = manager.getRepository<ObjectStorageField>(ObjectStorageField)

        const owner = await objectsRepo.save(objectsRepo.create({ isArray: Array.isArray(o) }));

        if (owner.isArray) {
            for (const key in o) {
                const value = o[key];
                const keyNumber = Number(key)
                const field: DeepPartial<ObjectStorageField> = { keyNumber, owner }
                await setFieldValue(field, value);
                await fieldsRepo.save(fieldsRepo.create(field))
            }
        } else {
            for (const key in o) {
                if (Object.prototype.hasOwnProperty.call(o, key)) {
                    const value = o[key];
                    const keyString = await this.getSharedString(key, manager)
                    const field: DeepPartial<ObjectStorageField> = { keyString, owner }
                    await setFieldValue(field, value)
                    await fieldsRepo.save(fieldsRepo.create(field))
                }
            }
        }
        return owner
    }

    @Transaction()
    async saveObject(o: object, @TransactionManager() manager?: EntityManager) {
        const rootDbObject = await this.makeDbObject(o, manager)
        return (rootDbObject).id
    }

    async loadObject(id: number) {
        const owner = await this.objectsRepo.findOne(id);
        const fields = await this.fieldsRepo.find({ where: { owner: { id } }, relations: ['objectValue'] })


        const getfieldValue = async (f: ObjectStorageField) => {
            if (f.objectValue) return await this.loadObject(f.objectValue.id)
            if (f.stringValue) return f.stringValue.value
            if (typeof f.booleanValue === 'boolean') return f.booleanValue
            if (f.dateValue) return f.dateValue
            if (f.isNull) return null
            if (f.numberValue) return f.numberValue
        }
        if (owner.isArray) {
            const a = []
            for (const f of fields) {
                const key = f.keyNumber
                const value = await getfieldValue(f)

                a[key] = value
            }
            return a
        } else {
            const o = {}
            for (const f of fields) {
                const key = f.keyString.value
                const value = await getfieldValue(f)
                o[key] = value
            }

            return o
        }
    }
}

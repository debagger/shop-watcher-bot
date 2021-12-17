import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectStorageField, ObjectStorageObject, ObjectStorageSharedString } from '../../entities';
import { ObjectStorageService } from './object-storage.service';
import * as os from 'os'
import * as path from 'path'
import { performance } from "perf_hooks";

let counter = 0
describe('ObjectStorageServiceService', () => {
  let service: ObjectStorageService
  let module: TestingModule
  let dbpath: string
  beforeEach(async () => {
    dbpath = path.join(os.tmpdir(), performance.now() + "_" + counter + ".sqlite")
    counter++
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: dbpath,
          dropSchema: true,
          entities: [ObjectStorageField, ObjectStorageObject, ObjectStorageSharedString],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([ObjectStorageObject, ObjectStorageField, ObjectStorageSharedString]),
      ],
      providers: [ObjectStorageService]
    }).compile();

    service = module.get<ObjectStorageService>(ObjectStorageService);
  });

  afterEach(async ()=>{
    await module.close()
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('saves simple object', async () => {
    expect(() => service.saveObject({ num: 1 })).not.toThrow()
  })

  it('saves simple object2', async () => {
    expect(() => service.saveObject({ num: 1 })).not.toThrow()
  })
});

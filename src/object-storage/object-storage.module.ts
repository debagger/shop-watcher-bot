import { Module, OnModuleInit } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { ObjectStorageField, ObjectStorageObject, ObjectStorageSharedString, ProxyTestRun } from './../entities';
import { ObjectStorageService } from './object-storage-service/object-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([ObjectStorageObject, ObjectStorageField, ObjectStorageSharedString, ProxyTestRun])],
  providers: [ObjectStorageService]
})
export class ObjectStorageModule implements OnModuleInit {
  constructor(private objectStorageService: ObjectStorageService,
    @InjectRepository(ProxyTestRun) private testRunRepo: Repository<ProxyTestRun>) {

  }
  async onModuleInit() {
    const errors = await this.testRunRepo.find({ select: ['errorResult'], 
    where: { errorResult: Not(IsNull()) }, take:1 });
    
    try {
      console.dir(errors[0], { compact: 6, depth: 5 })
      const objectId = await this.objectStorageService.saveObject(errors[0])
      const loaded = await this.objectStorageService.loadObject(objectId)
      console.dir(loaded, { compact: 6, depth: 5 })
    } catch (error) {
      console.log(error)
    }
  }

}

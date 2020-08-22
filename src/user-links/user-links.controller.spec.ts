import { Test, TestingModule } from '@nestjs/testing';
import { UserLinksController } from './user-links.controller';

describe('UserLinks Controller', () => {
  let controller: UserLinksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserLinksController],
    }).compile();

    controller = module.get<UserLinksController>(UserLinksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

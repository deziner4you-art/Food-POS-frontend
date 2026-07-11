import { Test, TestingModule } from '@nestjs/testing';
import { OnlineOrdersController } from './online-orders.controller';

describe('OnlineOrdersController', () => {
  let controller: OnlineOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnlineOrdersController],
    }).compile();

    controller = module.get<OnlineOrdersController>(OnlineOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { OnlineOrdersService } from './online-orders.service';

describe('OnlineOrdersService', () => {
  let service: OnlineOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlineOrdersService],
    }).compile();

    service = module.get<OnlineOrdersService>(OnlineOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

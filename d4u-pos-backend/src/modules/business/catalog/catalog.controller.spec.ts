import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

describe('CatalogController', () => {
  let controller: CatalogController;
  let service: any;

  beforeEach(async () => {
    service = {
      getMenus: jest.fn(),
      getCategories: jest.fn(),
      getProducts: jest.fn(),
      exportProductsCsv: jest.fn().mockResolvedValue('csv'),
      importProductsCsv: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: service }],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-F1: confirms the controller actually wires @CurrentUser()
  // through to the service for every route touched by the brand-boundary
  // fix -- the security-relevant query-shape assertions themselves live in
  // catalog.service.spec.ts, this just confirms the plumbing.
  describe('@CurrentUser() wiring (Task #2R-F1)', () => {
    const AUTH_USER = { sub: 1, active_brand_id: 1 };

    it('getMenus passes authenticatedUser through', () => {
      controller.getMenus(undefined, undefined, AUTH_USER);
      expect(service.getMenus).toHaveBeenCalledWith(expect.any(Object), AUTH_USER);
    });

    it('getCategories passes authenticatedUser through', () => {
      controller.getCategories(undefined, undefined, undefined, undefined, undefined, AUTH_USER);
      expect(service.getCategories).toHaveBeenCalledWith(expect.any(Object), AUTH_USER);
    });

    it('getProducts passes authenticatedUser through', () => {
      controller.getProducts(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, AUTH_USER);
      expect(service.getProducts).toHaveBeenCalledWith(expect.any(Object), AUTH_USER);
    });

    it('exportProducts passes authenticatedUser through', async () => {
      const res: any = { set: jest.fn(), send: jest.fn() };
      await controller.exportProducts(res, '5', AUTH_USER);
      expect(service.exportProductsCsv).toHaveBeenCalledWith(5, AUTH_USER);
    });

    it('importProducts passes authenticatedUser through', () => {
      const file: any = { originalname: 'x.csv', buffer: Buffer.from('') };
      controller.importProducts('5', file, AUTH_USER);
      expect(service.importProductsCsv).toHaveBeenCalledWith(5, file.buffer, AUTH_USER);
    });
  });
});

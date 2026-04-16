import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status with ok and timestamp', () => {
    const result = controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe('string');
  });
});

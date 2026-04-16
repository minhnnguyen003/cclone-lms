import { Test, TestingModule } from '@nestjs/testing';

import { RedisService } from '@/redis/redis.service';

// Mock ioredis so we don't need a real Redis server in unit tests
jest.mock('ioredis', () => {
  const mockClient = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue('test-value'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  };
  return jest.fn().mockImplementation(() => mockClient);
});

import Redis from 'ioredis';

describe('RedisService', () => {
  let service: RedisService;
  let mockClient: jest.Mocked<{
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    quit: jest.Mock;
  }>;

  beforeEach(async () => {
    process.env['REDIS_URL'] = 'redis://localhost:6379';

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    service.onModuleInit();

    // Access the mock instance created by the constructor
    const MockRedis = Redis as jest.MockedClass<typeof Redis>;
    mockClient = MockRedis.mock.results[MockRedis.mock.results.length - 1]
      .value as jest.Mocked<{
      set: jest.Mock;
      get: jest.Mock;
      del: jest.Mock;
      quit: jest.Mock;
    }>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env['REDIS_URL'];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should throw if REDIS_URL is not set', () => {
      delete process.env['REDIS_URL'];
      const uninitializedService = new RedisService();
      expect(() => uninitializedService.onModuleInit()).toThrow(
        'REDIS_URL environment variable is not set',
      );
    });
  });

  describe('set', () => {
    it('should call client.set with key, value, EX, and ttlSeconds', async () => {
      await service.set('test-key', 'test-value', 60);
      expect(mockClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
        'EX',
        60,
      );
    });
  });

  describe('get', () => {
    it('should call client.get with the key and return the value', async () => {
      const result = await service.get('test-key');
      expect(mockClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null when key does not exist', async () => {
      mockClient.get.mockResolvedValueOnce(null);
      const result = await service.get('nonexistent-key');
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should call client.del with the key', async () => {
      await service.del('test-key');
      expect(mockClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('onModuleDestroy', () => {
    it('should call client.quit', async () => {
      await service.onModuleDestroy();
      expect(mockClient.quit).toHaveBeenCalled();
    });
  });
});

import { Test } from '@nestjs/testing';
import { RabbitMqService } from './rabbit-mq.service';

describe('RabbitMqService', () => {
  let service: RabbitMqService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RabbitMqService],
    }).compile();

    service = module.get(RabbitMqService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});

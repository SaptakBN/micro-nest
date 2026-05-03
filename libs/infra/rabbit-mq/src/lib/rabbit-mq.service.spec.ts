import { Test } from '@nestjs/testing';
import { InfraRabbitMqService } from './rabbit-mq.service';

describe('InfraRabbitMqService', () => {
  let service: InfraRabbitMqService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [InfraRabbitMqService],
    }).compile();

    service = module.get(InfraRabbitMqService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});

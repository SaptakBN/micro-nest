import { RegisterDto } from '@micro-nest/dto';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async register(data: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        full_name: data.full_name,
      },
    });

    return {
      statusCode: 201,
      message: 'User registered successfully  ',
      received: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}

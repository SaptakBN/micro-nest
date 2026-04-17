import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

interface AuthService {
  Login(data: {
    email: string;
    password: string;
  }): Observable<{ accessToken: string; refreshToken: string }>;

  Register(data: {
    full_name: string;
    email: string;
    password: string;
  }): Observable<{
    message: string;
    statusCode: number;
    user: { id: number; email: string; full_name: string };
  }>;

  Refresh(data: { refreshToken: string }): Observable<{
    accessToken: string;
  }>;
}

@Injectable()
export class AuthClientService implements OnModuleInit {
  private authService!: AuthService;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthService>('AuthService');
  }

  async login(data: { email: string; password: string }) {
    return lastValueFrom(this.authService.Login(data));
  }

  async register(data: { full_name: string; email: string; password: string }) {
    return lastValueFrom(this.authService.Register(data));
  }

  async refresh(refreshToken: string) {
    return lastValueFrom(this.authService.Refresh({ refreshToken }));
  }
}

# MicroNest Project Documentation

## Project Overview

MicroNest is a microservices-based application built using NestJS framework within an Nx monorepo. The project implements a basic authentication system with an API Gateway that proxies requests to individual services. The architecture follows microservices principles with separate services for authentication and user management, shared libraries for DTOs and configuration, and end-to-end testing.

**Current Status**: The project is actively in development. Core infrastructure includes API Gateway with request proxying, Prisma ORM with MariaDB integration for data persistence, user registration with password hashing, and comprehensive configuration management. Authentication service now has real database integration for user creation and validation.

**Technologies Used**:

- **Framework**: NestJS v11
- **Build Tool**: Nx v22.6.4
- **Language**: TypeScript
- **Testing**: Jest
- **Validation**: class-validator, class-transformer
- **Proxy**: http-proxy-middleware
- **HTTP Client**: Axios
- **ORM**: Prisma v7.6.0 with MariaDB adapter
- **Database**: MariaDB 3.4.5
- **Password Hashing**: bcrypt v6.0.0

## Architecture

The project follows a microservices architecture with the following components:

### Applications (Services)

1. **api-gateway** (Port 3000): Entry point that proxies requests to internal services
2. **auth-service** (Port 3001): Handles authentication-related operations
3. **user-service** (Port 3002): Manages user data and operations

### Libraries

1. **dto**: Shared data transfer objects with validation
2. **shared/config**: Centralized configuration management

### Testing

- E2E tests for each service using Jest and Axios

## Services Detail

### API Gateway

**Purpose**: Acts as a single entry point for all client requests, routing them to appropriate microservices.

**Key Components**:

#### Main Entry Point (`apps/api-gateway/src/main.ts`)

```typescript
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { getConfig } from '@micro/config';

async function bootstrap() {
  const config = getConfig('servicePort');
  const globalPrefix = 'api';
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix(globalPrefix);
  const port = config.API_GATEWAY;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
```

#### App Module (`apps/api-gateway/src/app/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from '../core/auth.controller';
import { ProxyService } from '../core/proxy.service';

@Module({
  imports: [],
  controllers: [AppController, AuthController],
  providers: [AppService, ProxyService],
})
export class AppModule {}
```

#### Auth Controller (`apps/api-gateway/src/core/auth.controller.ts`)

Handles authentication routes and proxies them to the auth service:

```typescript
import { Controller, Req, Res, Next, Post, Body } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import type { Request, Response, NextFunction } from 'express';
import { getConfig } from '@micro/config';
import { LoginDto, RegisterDto } from '@micro-nest/dto';

const config = getConfig('serviceUrl');

@Controller()
export class AuthController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('/auth/register')
  handleRegister(@Body() body: RegisterDto, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.proxyService.forward(req, res, next, config.AUTH_SERVICE as string, '/api/register');
  }

  @Post('/auth/login')
  handleLogin(@Body() body: LoginDto, @Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    return this.proxyService.forward(req, res, next, config.AUTH_SERVICE as string, '/auth');
  }
}
```

#### Proxy Service (`apps/api-gateway/src/core/proxy.service.ts`)

Implements HTTP proxy middleware with caching and error handling:

```typescript
import { Injectable } from '@nestjs/common';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import type { RequestHandler, NextFunction, Response, Request } from 'express';
import { ServerResponse, IncomingMessage } from 'http';

@Injectable()
export class ProxyService {
  private cache = new Map<string, RequestHandler>();

  private getProxy(target: string, forwardPath: string): RequestHandler {
    const key = `${target}_${forwardPath}`;

    if (this.cache.has(key)) {
      return this.cache.get(key) as RequestHandler;
    }

    const options: Options = {
      target,
      changeOrigin: true,
      ignorePath: true,
      timeout: 3000,
      proxyTimeout: 3000,
      // ... error handling and request transformation
    };

    const proxy = createProxyMiddleware(options);
    this.cache.set(key, proxy);

    return proxy;
  }

  forward(req: Request, res: Response, next: NextFunction, target: string, stripPath: string) {
    const proxy = this.getProxy(target, stripPath);
    return proxy(req, res, next);
  }
}
```

### Auth Service

**Purpose**: Handles user authentication including registration and login with persistent data storage.

**Key Components**:

#### Main Entry Point (`apps/auth-service/src/main.ts`)

```typescript
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { getConfig } from '@micro/config';

async function bootstrap() {
  const config = getConfig('servicePort');
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = config.AUTH_SERVICE;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
```

#### App Controller (`apps/auth-service/src/app/app.controller.ts`)

```typescript
import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { UserCreateInput } from '../generated/prisma/models';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('/register')
  register(@Body() body: UserCreateInput) {
    return this.appService.register(body);
  }
}
```

#### Prisma Service (`apps/auth-service/src/app/prisma.service.ts`)

Manages database connections with MariaDB adapter:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getConfig } from '@micro/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const config = getConfig('db_config');
    const adapter = new PrismaMariaDb(config.url, {
      onConnectionError(err) {
        console.error('Database connection error:', err);
      },
    });
    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

#### App Service (`apps/auth-service/src/app/app.service.ts`)

Contains business logic for user registration with password hashing:

```typescript
import { RegisterDto } from '@micro-nest/dto';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async register(data: RegisterDto) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // Hash password with bcrypt
    const hashed = await bcrypt.hash(data.password, 10);

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        full_name: data.full_name,
      },
    });

    return {
      statusCode: 201,
      message: 'User registered successfully',
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
```

**Current Implementation Status**: Full user registration with database persistence. Features include:

- Email uniqueness validation
- Password hashing using bcrypt (10 rounds)
- User creation with automatic ID generation
- Duplicate email detection with ConflictException

### User Service

**Purpose**: Manages user data and operations.

**Current Implementation Status**: Basic NestJS service with minimal functionality. No specific user-related endpoints implemented yet.

## Shared Libraries

### DTO Library (`libs/dto`)

Contains shared data transfer objects with validation decorators.

#### Auth DTOs

- **LoginDto** (`libs/dto/src/lib/auth-dto/login.dto.ts`):

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
```

- **RegisterDto** (`libs/dto/src/lib/auth-dto/registration.dto.ts`):

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
```

### Config Library (`libs/shared/config`)

Centralized configuration management for service ports, URLs, and database connections.

#### Service Port Config (`libs/shared/config/src/lib/service-port.config.ts`)

```typescript
export const SERVICE_PORT_CONFIG = {
  API_GATEWAY: process.env.API_GATEWAY_PORT || 3000,
  AUTH_SERVICE: process.env.AUTH_SERVICE_PORT || 3001,
  USER_SERVICE: process.env.USER_SERVICE_PORT || 3002,
} as const;
```

#### Service URL Config (`libs/shared/config/src/lib/service-url.config.ts`)

```typescript
export const SERVICE_URL_CONFIG = {
  API_GATEWAY: process.env.API_GATEWAY_URL || 'http://localhost:3000',
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3002',
} as const;
```

#### Database Config (`libs/shared/config/src/lib/db.config.ts`)

```typescript
export const DB_CONFIG = {
  url: process.env['DATABASE_URL'] || '',
} as const;
```

**Configuration Usage**:

The config system is now enhanced with proper TypeScript typing:

```typescript
export function getConfig<KEY extends keyof typeof config>(key: KEY): (typeof config)[KEY] {
  return config[key];
}
```

## Configuration

### Nx Configuration (`nx.json`)

- Uses Nx plugins for TypeScript, Webpack, ESLint, Jest, and Docker
- Configured for monorepo with shared dependencies
- Excludes e2e test directories from Jest runs

### Package.json Scripts

- `start`: Runs all services in parallel with watch mode
- Individual build/serve/test commands available via Nx

## Testing

### E2E Tests

Each service has corresponding e2e tests that verify basic API endpoints:

- **api-gateway-e2e**: Tests the gateway's root endpoint
- **auth-service-e2e**: Tests the auth service's root endpoint
- **user-service-e2e**: Tests the user service's root endpoint

Example test (`apps/api-gateway-e2e/src/api-gateway/api-gateway.spec.ts`):

```typescript
import axios from 'axios';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });
});
```

## How to Run

### Prerequisites

- Node.js
- pnpm (recommended) or npm

### Installation

```bash
pnpm install
```

### Development

```bash
# Run all services
pnpm start

# Or run individual services
npx nx serve api-gateway
npx nx serve auth-service
npx nx serve user-service
```

### Testing

```bash
# Run all tests
npx nx run-many --target=test

# Run e2e tests
npx nx run-many --target=e2e
```

### Building

```bash
# Build all services
npx nx run-many --target=build

# Build individual service
npx nx build api-gateway
```

## Current Status and Limitations

### Implemented Features

- ✅ Basic microservices architecture with API Gateway
- ✅ Proxy middleware for request forwarding with request logging
- ✅ Shared DTOs with validation
- ✅ Centralized configuration management (ports, URLs, database)
- ✅ Nx monorepo setup with proper tooling
- ✅ Basic E2E testing structure
- ✅ TypeScript throughout the codebase
- ✅ **Database Integration**: Prisma ORM with MariaDB adapter
- ✅ **User Persistence**: User creation and storage in database
- ✅ **Password Security**: bcrypt password hashing (10 rounds)
- ✅ **User Validation**: Email uniqueness checking, duplicate prevention
- ✅ **Error Handling**: ConflictException for duplicate emails, proxy error handling

### Missing/Incomplete Features

- ❌ Login endpoint implementation (registration is complete)
- ❌ JWT token generation and validation
- ❌ User service functionality
- ❌ Advanced error handling and logging improvements
- ❌ Security middleware (CORS, rate limiting, etc.)
- ❌ API documentation (Swagger/OpenAPI)
- ❌ Docker containerization (basic setup exists but not configured)
- ❌ Environment-specific configurations
- ❌ Health checks and monitoring
- ❌ CI/CD pipelines
- ❌ User profile management endpoints
- ❌ Password reset functionality

### Known Issues

- Database URL must be set via DATABASE_URL environment variable
- Login endpoint routing needs refinement
- Proxy service logging could be enhanced with request IDs
- No integration between auth and user services yet

## Recent Changes (Last 2 Commits)

### Commit 1: "feat: auth user database setup"

- Added Prisma ORM with MariaDB adapter integration
- Created PrismaService for database connection management
- Added database configuration to shared config library
- Added @prisma/adapter-mariadb and bcrypt dependencies

### Commit 2: "feat: user creation is done"

- Implemented full user registration flow in auth service
- Added password hashing with bcrypt (10 salt rounds)
- Added email uniqueness validation
- Replaced mock registration with actual database persistence
- Added request logging in proxy service for debugging
- Improved error handling with ConflictException for duplicate emails
- Enhanced config system with proper TypeScript generics for type safety

## Future Development Roadmap

1. **Authentication Completion** (HIGH PRIORITY)
   - ✅ User registration with database (DONE)
   - Implement login endpoint with credential validation
   - Implement JWT token generation and validation
   - Add refresh token mechanism
   - Create authentication middleware for protected routes

2. **User Service Development**
   - User profile retrieval endpoints
   - User profile update functionality
   - User deletion with cascading permissions
   - User search and filtering

3. **API Gateway Improvements**
   - Authentication middleware for protected routes
   - Enhanced request/response logging with correlation IDs
   - Rate limiting per IP/user
   - CORS configuration
   - Request validation

4. **Infrastructure & DevOps**
   - Docker Compose setup with MariaDB
   - Environment configuration files (.env.example)
   - Database migration scripts
   - Health check endpoints
   - Kubernetes manifests
   - CI/CD with Nx Cloud

5. **Security**
   - Input sanitization and sanitizer
   - HTTPS/TLS configuration
   - API key management
   - Security headers (helmet)
   - CORS configuration
   - Request timeout configurations

6. **Observability & Monitoring**
   - Structured logging system
   - Request tracing with correlation IDs
   - Performance monitoring
   - Error tracking integration

7. **Documentation**
   - OpenAPI/Swagger documentation
   - API usage examples
   - Architecture diagrams
   - Database schema documentation
   - Deployment guides

## Project Structure Summary

```
micro-nest/
├── apps/
│   ├── api-gateway/          # API Gateway service
│   ├── auth-service/         # Authentication service
│   ├── user-service/         # User management service
│   ├── *-e2e/               # E2E test suites
├── libs/
│   ├── dto/                 # Shared DTOs
│   └── shared/
│       └── config/          # Shared configuration
├── nx.json                  # Nx configuration
├── package.json             # Root dependencies and scripts
└── tsconfig.base.json       # Base TypeScript config
```

This documentation provides a comprehensive overview of the current state of the MicroNest project, suitable for onboarding new developers or providing context to AI language models for continued development.</content>
<parameter name="filePath">/var/www/html/micro-nest/doc.md

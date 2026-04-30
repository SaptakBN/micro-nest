# MicroNest Project Documentation

## Project Overview

MicroNest is a NestJS/Nx monorepo that implements a small microservices authentication and user-profile system. The public API is exposed through an API Gateway. The gateway accepts REST requests, validates DTOs, enforces JWT/session checks for protected routes, and calls internal services over gRPC.

The current codebase has moved beyond the older HTTP proxy implementation. The API Gateway no longer uses `ProxyService` or `http-proxy-middleware` for auth/user calls. Auth and user operations are now defined in protobuf files, generated into TypeScript contracts, and consumed through NestJS gRPC clients.

## Current Status

The main implemented flow is:

1. Client registers through `POST /api/auth/register`.
2. API Gateway validates the request and calls `AuthService.Register` over gRPC.
3. Auth service stores credentials in its MySQL database and hashes passwords with bcrypt.
4. Auth service calls user service over gRPC to create the matching profile row in the user service PostgreSQL database.
5. Client logs in through `POST /api/auth/login`.
6. Auth service validates the password, creates a Redis-backed session, and returns access and refresh JWTs.
7. Protected profile endpoints validate the access token and verify the session in Redis before calling user service.

## Technology Stack

- Framework: NestJS 11
- Monorepo/build: Nx 22.6.4
- Language: TypeScript 5.9
- Transport: HTTP/REST at the gateway, gRPC between services
- Contracts: protobuf + `ts-proto`
- Auth: JWT, Passport JWT strategy, bcrypt
- Session store: Redis through `ioredis`
- Auth database: MySQL, Prisma 7
- User database: PostgreSQL, Prisma 7
- Testing: Jest and Axios-based e2e suites
- Containerization: Dockerfile plus production and dev Docker Compose files

## Repository Structure

```text
micro-nest/
|-- apps/
|   |-- api-gateway/          # Public REST gateway
|   |-- auth-service/         # gRPC auth service, MySQL-backed credentials
|   |-- user-service/         # gRPC user profile service, PostgreSQL-backed profiles
|   |-- api-gateway-e2e/
|   |-- auth-service-e2e/
|   `-- user-service-e2e/
|-- libs/
|   |-- common/
|   |   |-- proto/            # auth.proto and user.proto
|   |   `-- contracts/        # generated ts-proto contracts
|   |-- dto/                  # REST DTOs used by the gateway
|   |-- infra/
|   |   `-- redis/            # shared Redis module/service/provider
|   `-- shared/
|       `-- config/           # environment-backed config helpers
|-- Dockerfile
|-- docker-compose.yaml       # production-style stack
|-- docker-compose.dev.yml    # local infra stack
|-- redis.acl
|-- package.json
`-- nx.json
```

## Applications

### API Gateway

Location: `apps/api-gateway`

Purpose:

- Exposes public REST endpoints under the `/api` global prefix.
- Validates request bodies with a global `ValidationPipe`.
- Uses gRPC clients to call auth and user services.
- Converts gRPC errors into HTTP errors through `GrpcToHttpExceptionFilter`.
- Protects user profile endpoints through Passport JWT and Redis session validation.

Important files:

- `src/main.ts`: bootstraps the HTTP Nest app on `PORT`, applies validation and `GrpcToHttpExceptionFilter`.
- `src/app/app.module.ts`: registers Passport, Redis, and gRPC clients for auth and user services.
- `src/core/auth.controller.ts`: exposes auth REST endpoints.
- `src/core/user.controller.ts`: exposes protected user profile REST endpoints.
- `src/core/auth.client.service.ts`: wraps the generated `AuthServiceClient`.
- `src/core/user.client.service.ts`: wraps the generated `UserServiceClient`.
- `src/core/grpc-base.client.ts`: converts gRPC observables into promises with timeout, retry, and normalized error objects.
- `src/core/jwt/jwt.strategy.ts`: validates JWT payloads and checks session existence in Redis.
- `src/core/session.service.ts`: reads session hashes from Redis for gateway-side auth checks.

Public routes:

| Method | Route | Protection | Description |
| --- | --- | --- | --- |
| `GET` | `/api` | none | Basic health/example response from the generated app controller. |
| `POST` | `/api/auth/register` | none | Registers auth credentials and creates a user profile through gRPC. |
| `POST` | `/api/auth/login` | none | Returns `access_token` and `refresh_token`. |
| `POST` | `/api/auth/refresh-token` | none | Uses refresh token to issue a new access token. |
| `GET` | `/api/user/profile` | bearer JWT + Redis session | Returns the authenticated user's profile. |
| `POST` | `/api/user/profile/update` | bearer JWT + Redis session | Updates profile fields. |

### Auth Service

Location: `apps/auth-service`

Purpose:

- Runs as a NestJS gRPC microservice using `auth.proto`.
- Owns authentication credentials in MySQL.
- Hashes passwords with bcrypt.
- Issues access and refresh JWTs.
- Creates and deletes Redis sessions.
- Calls user service over gRPC during registration to create the profile record.

Important files:

- `src/main.ts`: creates the Nest app and connects the gRPC microservice on `0.0.0.0:${PORT}`.
- `src/app/app.controller.ts`: implements generated `AuthServiceController`.
- `src/app/app.service.ts`: contains register, login, refresh token, logout, and logout-all business logic.
- `src/app/session.service.ts`: creates Redis session hashes and tracks `user_sessions:{userId}` sets.
- `src/app/user.client.service.ts`: gRPC client used to create user profiles.
- `prisma/schema.prisma`: MySQL schema for auth credentials.

Auth database schema:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Implemented gRPC methods:

- `Register(RegisterRequest) returns RegisterResponse`
- `Login(LoginRequest) returns LoginResponse`
- `RefreshToken(RefreshTokenRequest) returns RefreshTokenResponse`

Notes:

- `logout` and `logoutAll` exist in `AppService`, but they are not currently exposed in `auth.proto` or the API Gateway routes.
- Refresh token validation verifies the JWT and checks the Redis session before issuing a new access token.
- Access tokens include `sub`, `sid`, and `email`; the gateway uses `sid` and `sub` to validate the Redis session.

### User Service

Location: `apps/user-service`

Purpose:

- Runs as a NestJS gRPC microservice using `user.proto`.
- Owns user profile data in PostgreSQL.
- Creates profiles when auth registration succeeds.
- Returns and updates authenticated user profiles.

Important files:

- `src/main.ts`: creates the Nest app and connects the gRPC microservice on `0.0.0.0:${PORT}`.
- `src/app/app.controller.ts`: implements generated `UserServiceController`.
- `src/app/app.service.ts`: creates users, reads profiles, updates profiles, and maps protobuf timestamps to JavaScript dates.
- `src/app/prisma.service.ts`: owns PostgreSQL Prisma connection lifecycle.
- `prisma/schema.prisma`: PostgreSQL schema for user profiles.

User database schema:

```prisma
model User {
  id        String   @id
  email     String   @unique
  full_name String
  gender    Gender?
  dob       DateTime?
  phone     String?
  city      String?
  country   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Gender {
  male
  female
}
```

Implemented gRPC methods:

- `CreateUser(UserCreateRequest) returns UserCreateResponse`
- `GetUserProfile(UserGetProfileRequest) returns UserProfile`
- `UpdateUserProfile(UserUpdateRequest) returns UserProfile`

## Shared Libraries

### `libs/common/proto`

Contains protobuf source contracts:

- `auth.proto`: auth login, registration, and refresh token RPCs.
- `user.proto`: user creation, profile lookup, and profile update RPCs.

### `libs/common/contracts`

Generated TypeScript contracts from protobuf files. The library exports generated service names, package names, request/response types, enums, and NestJS controller/client interfaces.

Regenerate contracts with:

```bash
npm run generate:contracts
```

### `libs/dto`

DTOs used by the public REST API:

- `RegisterDto`: `full_name`, `email`, `password`
- `LoginDto`: `email`, `password`
- `RefreshTokenDto`: validates `refresh_token` as a JWT
- `ProfileUpdateDto`: optional `full_name`, `gender`, `dob`, `phone`, `city`, `country`

`ProfileUpdateDto` transforms `dob` values into protobuf timestamp-shaped objects before they are sent to user service.

### `libs/shared/config`

Centralized environment-backed config:

- `servicePort`: `PORT`
- `serviceUrl`: `API_GATEWAY_URL`, `AUTH_SERVICE_URL`, `USER_SERVICE_URL`
- `db`: `DATABASE_URL`
- `jwt`: `JWT_SECRET`, `JWT_EXPIRES_IN`
- `redis`: `REDIS_URL`

Unlike the older docs, service ports are no longer separate `API_GATEWAY_PORT`, `AUTH_SERVICE_PORT`, and `USER_SERVICE_PORT` keys inside the runtime config. Each process reads a single `PORT`.

### `libs/infra/redis`

Shared Redis module built on `ioredis`.

It provides:

- basic string operations: `get`, `set`, `del`
- set operations: `sadd`, `smembers`, `srem`
- hash operations: `hset`, `hget`, `hdel`
- typed session helpers: `hsetWithExpire`, `hgetAllTyped`

Redis config is read from `REDIS_URL`.

## Infrastructure

### Local Development Infrastructure

`docker-compose.dev.yml` starts supporting services only:

- MySQL on host port `3307` for auth service
- PostgreSQL on host port `5480` for user service
- Redis on host port `6380`
- RabbitMQ on host port `5680`, dashboard on `15672`

Start and stop local infra:

```bash
npm run docker:dev:up
npm run docker:dev:down
```

Then run app services through Nx/npm scripts.

### Production-Style Compose

`docker-compose.yaml` defines:

- `auth-db` on an internal auth network
- `user-db` on an internal user network
- `redis` with ACL file support
- `rabbitmq`
- `migration-auth` and `migration-user`
- `auth-service`
- `user-service`
- `api-gateway`

The gateway is the only application service with a published host port. Internal services communicate over Docker networks.

### Dockerfile

The Dockerfile has separate stages:

- `deps`: installs workspace dependencies.
- `builder`: builds a selected Nx service and prunes dev dependencies.
- `runner`: runtime image for a selected service.
- `migration`: Prisma migration image for a selected service.

### Redis ACL

`redis.acl` disables the default user and defines:

- `write_user`: full access, used by auth service for session creation/deletion.
- `read_user`: read-oriented access to `session:*`, used by the API Gateway for session validation.

## Environment Files

Development env files are split by process:

- `.env.dev`: shared values such as `JWT_SECRET`, `JWT_EXPIRES_IN`, `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, and `RABBITMQ_URL`.
- `.env.dev.auth`: auth service `PORT`, MySQL `DATABASE_URL`, and write Redis URL.
- `.env.dev.user`: user service `PORT` and PostgreSQL `DATABASE_URL`.
- `.env.dev.gateway`: gateway `PORT` and read Redis URL.

The npm dev scripts load `.env.dev` plus the service-specific env file with `dotenv-cli`.

## Important Scripts

```bash
npm run start                 # run auth, user, and gateway services concurrently
npm run dev:auth              # run auth service
npm run dev:user              # run user service
npm run dev:gateway           # run API Gateway
npm run build                 # build auth, user, and gateway services concurrently
npm run migrate:auth:dev      # run auth Prisma dev migration
npm run migrate:user:dev      # run user Prisma dev migration
npm run migrate:auth:deploy   # deploy auth migrations
npm run migrate:user:deploy   # deploy user migrations
npm run generate-client:auth  # generate auth Prisma client
npm run generate-client:user  # generate user Prisma client
npm run generate:contracts    # regenerate gRPC TypeScript contracts
```

## Testing

The e2e suites currently remain basic health/example tests:

- `apps/api-gateway-e2e`
- `apps/auth-service-e2e`
- `apps/user-service-e2e`

Each checks `GET /api` returns `{ message: 'Hello API' }`.

There are also library-level unit tests, including Redis and shared config tests.

Current gap: the implemented registration, login, refresh-token, JWT guard, profile lookup, and profile update flows are not yet covered by e2e tests.

## Recent Changes Since `doc.md` Was Last Updated

`doc.md` was last updated at commit `2ad8169 chore: doc updated`. The current branch is at `a9d7c70 feat: grpc parsing issues fixed`. The main changes after the previous documentation update are:

- Added JWT validation in the gateway (`affe219`).
- Reworked the gateway/service communication from HTTP proxying to gRPC (`5577b93`, `5a0b129`, `6fdab7a`).
- Added protobuf contracts and generated TypeScript contract library (`a345d2b`, `5a0b129`, `045edc0`).
- Added Redis infrastructure, Redis ACLs, and Redis-backed auth sessions (`43bc813`, `bd385ae`, `a345d2b`, `f06d546`).
- Implemented refresh token handling and fixed access token creation (`7e5a5f4`, `d997c0f`).
- Added gRPC-to-HTTP exception mapping in the API Gateway (`545fbd7`).
- Added Dockerfile, dev compose, production compose, migration containers, and related build scripts (`ceed6e9`, `5c55658`, `b97fb1b`, `a0ddb06`, `e9b81ad`).
- Added user service Prisma schema, migrations, generated Prisma client, and PostgreSQL persistence (`ab67e1a`, `045edc0`, `91e6fd0`).
- Added auth-service to user-service communication so registration creates a user profile (`dc2e791`).
- Implemented profile read and update APIs (`d4fa960`, `29e2807`).
- Fixed enum/date/gRPC parsing issues for user profile updates (`ac23c20`, `a9d7c70`).

## Current Implemented Features

- Nx monorepo with three NestJS applications and shared libraries.
- Public REST API Gateway.
- Internal gRPC communication for auth and user operations.
- Shared protobuf contracts and generated TypeScript types.
- Registration with duplicate-email protection and bcrypt password hashing.
- Login with access and refresh JWT generation.
- Redis-backed session storage.
- Gateway-side JWT strategy with Redis session validation.
- Refresh-token endpoint.
- User profile creation from auth registration.
- Protected profile read endpoint.
- Protected profile update endpoint with optional fields.
- Separate auth and user databases.
- Prisma migrations for auth and user services.
- Dockerized runtime and migration images.
- Local development compose for databases, Redis, and RabbitMQ.
- Production-style compose with service networks and gateway-only public exposure.
- gRPC error normalization and HTTP error mapping at the gateway.

## Known Gaps and Caveats

- The README generated by Nx was stale and has been replaced with project-specific instructions.
- `http-proxy-middleware` is still present in dependencies, but the old `ProxyService` has been removed from the current gateway source.
- Auth service contains `logout` and `logoutAll` methods, but they are not exposed through protobuf or REST routes yet.
- RabbitMQ is included in environment and compose files, but no application code currently uses it.
- E2E tests do not yet cover the real auth/session/profile flows.
- Some controllers/services still contain temporary `console.log` statements for profile update debugging.
- The Docker healthcheck uses `GET /api`; this checks that the HTTP process responds, not deep database/gRPC dependency health.
- User service profile `dob` conversion depends on protobuf timestamp shape from the gateway DTO transform.

## Suggested Next Work

1. Add e2e coverage for register, login, refresh token, authenticated profile read, and profile update.
2. Expose logout/logout-all through `auth.proto` and gateway routes, or remove unused service methods.
3. Remove unused `http-proxy-middleware` dependency if no longer needed.
4. Replace temporary `console.log` debugging with structured logging.
5. Add explicit health endpoints for database, Redis, and gRPC dependencies.
6. Decide whether RabbitMQ is part of the near-term architecture; remove or document planned use if not.

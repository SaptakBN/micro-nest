# =============================================================================
# MicroNest – Dockerfile (npm version)
# =============================================================================

ARG NODE_VERSION=24
ARG ALPINE_VERSION=3.21

# ================= deps =================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps

WORKDIR /app

# Copy root manifests
COPY package.json package-lock.json ./

# Copy workspace package.json files (important for npm workspaces)
COPY apps/api-gateway/package.json   apps/api-gateway/
COPY apps/auth-service/package.json  apps/auth-service/
COPY apps/user-service/package.json  apps/user-service/
COPY libs/dto/package.json           libs/dto/
COPY libs/shared/config/package.json libs/shared/config/

# Install deps (clean + reproducible)
RUN npm ci


# ================= builder =================
FROM deps AS builder

ARG SERVICE_NAME
RUN test -n "$SERVICE_NAME" || (echo "SERVICE_NAME required" && exit 1)

COPY . .



# Nx build
RUN npx nx build ${SERVICE_NAME} --configuration=production

# Copy only what we need
RUN mkdir /prod

# Copy dist
RUN mkdir -p /prod/dist/${SERVICE_NAME}
RUN cp -r apps/${SERVICE_NAME}/dist/* /prod/dist/${SERVICE_NAME}/

# Copy prisma to ROOT (important)
RUN if [ -d "apps/${SERVICE_NAME}/prisma" ]; then \
      cp -r apps/${SERVICE_NAME}/prisma /prod/prisma; \
    fi

RUN if [ -f "apps/${SERVICE_NAME}/prisma.config.js" ]; then \
      cp apps/${SERVICE_NAME}/prisma.config.js /prod/prisma.config.js; \
    fi

# Generate Prisma client (use SAME final path)
RUN if [ -f "apps/${SERVICE_NAME}/prisma/schema.prisma" ]; then \
      npx prisma generate \
      --schema=apps/${SERVICE_NAME}/prisma/schema.prisma; \
    fi

# Copy deps
RUN cp -r node_modules /prod/node_modules
RUN cp package.json /prod/



# ================= runner =================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner

ARG SERVICE_NAME
ARG SERVICE_PORT=3000

ENV NODE_ENV=production \
    PORT=${SERVICE_PORT} \
    SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

# Install required runtime tools
RUN apk add --no-cache wget dumb-init

# Non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser  --system --uid 1001 --ingroup appgroup appuser

# Copy runtime files
COPY --from=builder --chown=appuser:appgroup /prod ./

USER appuser

EXPOSE ${SERVICE_PORT}

ENTRYPOINT ["dumb-init", "--"]

HEALTHCHECK \
  --interval=20s \
  --timeout=5s \
  --start-period=15s \
  --retries=3 \
  CMD wget -qO- http://localhost:${SERVICE_PORT}/api || exit 1

CMD sh -c "node dist/$SERVICE_NAME/main.js"

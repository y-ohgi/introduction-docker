# === base
FROM --platform=${BUILDPLATFORM:-linux/arm64} node:22-slim AS base

# === deps
FROM base AS deps

WORKDIR /app

COPY package* .

RUN npm install

# === builder
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

# === prod deps
FROM base AS prod_deps

WORKDIR /app

COPY --from=deps /app/package* .
COPY --from=deps /app/node_modules ./node_modules

RUN npm ci --omit=dev

# === runner
FROM --platform=${BUILDPLATFORM:-linux/arm64} gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /app

ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod_deps --chown=nonroot:nonroot /app/package* .
COPY --from=prod_deps --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/public ./public
COPY --from=builder --chown=nonroot:nonroot /app/.next ./.next

USER nonroot

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]

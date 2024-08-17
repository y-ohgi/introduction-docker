# === Builder
FROM --platform=${BUILDPLATFORM:-linux/arm64} node:22-slim AS builder

WORKDIR /app

COPY package* ./

RUN npm ci

COPY . .

RUN npm run build

# === Runner
FROM --platform=${BUILDPLATFORM:-linux/arm64} gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /app

COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/package*.json ./
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

USER nonroot

EXPOSE 3000

CMD ["dist/app.js"]

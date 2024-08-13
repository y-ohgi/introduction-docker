FROM --platform=$TARGETPLATFORM golang:1.22 AS builder

WORKDIR /app

COPY . .

RUN go build -o main .

FROM --platform=$TARGETPLATFORM busybox

WORKDIR /app

RUN adduser \
  --disabled-password \
  --gecos "" \
  --home "/nonexistent" \
  --shell "/sbin/nologin" \
  --no-create-home \
  --uid "1001" \
  app

USER app

COPY --from=builder --chown=app:app /app/main /bin/main

EXPOSE 8080

CMD ["main"]

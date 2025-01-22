---
title: マルチステージビルドについて
description: イメージの最適化を行うために使用するマルチステージビルドについて紹介します。
---

イメージは軽量であることが重要です。
コンテナを起動するためにはレジストリからイメージをpullしてから立ち上げる必要がありますが、巨大なイメージはpullに時間がかってしまいコンテナを起動するためのリードタイムが長くなります。

リードタイムが長くなることにより様々なリスクが伴います。

* デプロイ・ロールバックが遅くなる。
* スケールアウトが遅くなりコンテナの起動が間に合わずにリクエストを捌けなくなる。
* 巨大なイメージを保存するためにレジストリの保存領域もしくは保存料が高くなる。

軽量なイメージをビルドするための機能がマルチステージビルドで、複数のイメージから1つのイメージをビルドするための技術です。

例えばgolangであればバイナリファイルのみで実行が可能なため、ビルドレイヤーでバイナリを生成し、最終イメージは軽量なベースイメージを使用することで軽量なイメージをビルドすることが可能です。
以下がそのサンプルになります。
バイナリをビルドする **Builderイメージ** と、Builderイメージで生成したバイナリをコピーし実行する **Runnerイメージ** の2つからなるマルチステージビルドの例です。
```Dockerfile
# syntax=docker/dockerfile:1

# === Builder
FROM golang:1.22 AS builder

WORKDIR /app

COPY . .

RUN go build -o main .

# === Runner
FROM busybox AS runner

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
```

これにより、最終イメージは **Builderイメージ** のバイナリを所有した軽量な **Runnerイメージ** が作成できます。

```
$ docker build -t multistage-build .
```

`--target` オプションで中間イメージを指定することで、中間イメージのみをビルドすることも可能です。

```
$ docker buildx build -t multi-builder --target builder .
$ docker run -p 8080:8080 multi-builder ./main
```

参照: [introduction-docker/handson/multistage-build](https://github.com/y-ohgi/introduction-docker/tree/main/handson/multistage-build)

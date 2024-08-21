---
title: Dockerfileのベストプラクティス
description: この章ではDockerfileを記述する際のベストプラクティスについて紹介します。
---
  
この章ではDockerfileを記述する際のベストプラクティスについて紹介します。  
今までの章を元に、良いDockerfileを書くエッセンスになれば幸いです。

## ここまでのおさらいです。
* 「 [セキュリティ](./security.md) 」
    * 野良のイメージをベースイメージにしない
    * 様々なサードパティ製品もありますが、Dockerfileだけでも特権ユーザーを使わないなどの設定が必要となります。
* 「 [マルチステージビルド](./multistage-build.md) 」
    * イメージは軽量であるほどリードタイムが短くなり有利です。
    * マルチステージビルドを使うことで軽量なイメージを作成することができます。
* 「 [イメージの仕組みと設計](./image-design.md) 」
    * 「1コンテナ = 1プロセス」の原則、もしくは「1コンテナにつき1つの責務」でイメージを設計する必要があります。
    * コンテナはステートフルである必要があり、ログは標準出力に、永続データは外部のデータストアに入れましょう。

## 軽量なベースイメージを選択する
軽量イメージを作成するにはまず軽量ベースイメージを選択しましょう。  

Docker Hubで公式が提供するイメージは軽量な `slim` というタグが付いたイメージが存在します。  
また、Google Cloudはdistrolessというシェルなどが入っていないシンプルで軽量なイメージを提供しています。

Docker Hubのnodeイメージとそのnodeの軽量なイメージの2種、そしてGoogle Cloudが提供するdistrolessを比較してみましょう。
```
$ docker image list | grep node
node                                  latest            8994b3212f10   8 days ago          1.12GB
node                                  22-slim           ba83b0f18f30   8 days ago          240MB
gcr.io/distroless/nodejs22-debian12   latest            3e738efc87dc   N/A                 152MB
```

単純なnodeイメージは1GB以上と非常に大きく、逆に軽量化されたイメージは数百MBになります。  
一番軽量なdistrolessを使うことが理想ですが、シェルなどのツール群が入ってないないため、まずはslimを使用することをお勧めします。

* [GoogleContainerTools/distroless: 🥑 Language focused docker images, minus the operating system.](https://github.com/GoogleContainerTools/distroless)

!!! warn "Alpineイメージ"
    Alpineイメージは非常に軽量ですが、AlpineイメージのベースOSの歴史的経緯上扱いが非常に難しいため使用することはオススメできません。  
    元々フロッピーディスクに入るような軽量なOSとして開発された、イメージサイズの軽量化に特化されたもので、逆にそれ以外の非機能要件が満たせないことが多々あります。

## .dockerignoreを使う
Dockerのビルド時に無視するファイル/ディレクトリを指定することができます。  
`.git` のようなビルド時に不要なディレクトリ、 `node_modules` のようなDockerfile内でインストールするものを指定します。

`.dockerignore` は基本的に `.gitignore` と同じ書き方で設定可能です。

```
Dockerfile
compose.yaml
.dockerignore

.git/*
node_modules/*
dist/*
spec/*

.env*
.mk*

  :
```

## ビルド時に複数のアーキテクチャに対応させる
はじめに、Docker v19からbuildxサブコマンドが増え、Dockerのビルドは `docker buildx build` が使われるようになりました。  

従来以下のようなシンタックスシュガーを用いていたものが不要になり、マルチプラットフォームなど機能の拡張が行われました。
```bash
# syntax=docker/dockerfile:1
```

```
FROM --platform=$TARGETPLATFORM golang:1.22

WORKDIR /app

COPY . .

RUN go build -o main /bin/main

CMD ["main"]
```

```
$ docker buildx build \
  --load \
  --platform linux/amd64,linux/arm64 \
  -t multi-platform \
  .
```

`buildx` サブコマンドは従来の `docker build` の間に挟むだけで簡単に使用可能です。  
また、 `docker buildx build` 時に `--push` オプションを使うことで、同時にレジストリにpushを行うことも可能です。  
これにより一度のビルドで別々のアーキテクチャのイメージがビルドし、pushできます。

複数アーキテクチャを扱うメリットとして、例えば使用したいインスタンスが特定のアーキテクチャしか対応していない場合でも、push済みのイメージのアーキテクチャを暗黙的に使い分けることができます。  
最新のGPUインスタンスがまだamd64しか対応していない場合や、Windowsでローカル開発を行なっているが他のメンバーがarmであったり、本番とローカルでアーキテクチャが異なる場合に便利でしょう。  

レジストリのストレージを考慮する必要はありますが、複数のアーキテクチャを扱いやすくなります。

## TypeScript x Expressのサンプル
以下はTypeScriptでExpressのAPIを構築するDockerfileのサンプルです。  
コメントベースで紹介します。

```Dockerfile
# === Builder

# --platform=${BUILDPLATFORM:-linux/arm64} とすることでビルド時に、 "--platform" オプションが設定されていない場合デフォルトでlinux/arm64でビルドされます。
FROM --platform=${BUILDPLATFORM:-linux/arm64} node:22-slim AS builder

# /app ディレクトリを作成し、作業ディレクトリとして設定します。
WORKDIR /app

# package.jsonとpackage-lock.jsonをカレントディレクトリにコピーします。
COPY package* .

# パッケージインストール
RUN npm ci

# ソースコードなどをコピー
COPY . .

# ビルド
RUN npm run build

# === Runner
FROM --platform=${BUILDPLATFORM:-linux/arm64} gcr.io/distroless/nodejs22-debian12 AS runner

# /app ディレクトリを作成し、作業ディレクトリとして設定します。
WORKDIR /app

# "--from=builder" イメージのファイル・ディレクトリをコピー。
# "--chown=nonroot:nonroot" で権限を"nonroot"に変更する。
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/package*.json ./
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

# "nonroot" とすることで特権ユーザーを割り当てない。
USER nonroot

# 3000番ポートを使用することを明示的に記載。
EXPOSE 3000

# 実行するコードを宣言。
# MEMO: gcr.io/distroless/nodejs22-debian12 イメージにはENTRYPOINTに "node" 相当のコマンドが設定されている。
CMD ["dist/app.js"]
```

```
$ docker buildx build \
  --platform linux/amd64 \
  --load \
  -t myapp:latest \
  .
```

参照: [introduction-docker/handson/express](https://github.com/y-ohgi/introduction-docker/blob/main/handson/express/Dockerfile)

## まとめ
* 軽量なイメージを作るために、軽量で安全なベースイメージを使いましょう
* `.dockerignore` で不要なファイル・ディレクトリをビルド時に無視をしましょう
* 拡張構文を普段から利用する場合、 `docker buildx build` コマンドの採用を検討してみると良いでしょう。

## 参照
* [Building best practices | Docker Docs](https://docs.docker.com/build/building/best-practices/)
  * 公式のベストプラクティスです。

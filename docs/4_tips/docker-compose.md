---
title: "Dockerとは"
description: "Dockerを何故使うのか、VMとの違い、どんな技術でできているのかについて紹介します。"
---

docker-composeでよく使うTips集です。

## 環境変数の読み込み
一般的にDockerのベストプラクティスにのっとった設計をすると環境変数で各種パラメータの定義が重要になってきます。  
例えばMySQLのパスワードや各種接続情報や秘匿情報など、環境によって変更されるものは基本的にコンテナ起動時に環境変数で定義します。  

docker-composeを使用した場合どのような方法で定義するのか、代表的な4つの方法を紹介します。

### 1. docker-composeに起動時に渡す
```
$ docker-compose up -e MYSQL_PASSWORD=mypassword
```

### 2. docker-compose.yamlへ記述
```diff
version: '3.7'

services:
  app:
    build: .
+   environment:
+     - MYSQL_PASSWORD=mypassword
```


### 3. シェルの環境変数から読み込み
`docker-compose.yaml`
```diff
version: '3.7'

services:
  app:
    build: .
    environment:
-     - MYSQL_PASSWORD=mypassword
+     - MYSQL_PASSWORD=${MYSQL_PASSWORD}
```

```
$ export MYSQL_PASSWORD=mypassword
$ docker-compose up
```

### 4. ファイルから読み込む
`docker-compose.yaml`
```diff
version: '3.7'

services:
  app:
    build: .
-   environment:
-     - MYSQL_PASSWORD=mypassword
+   env_file:
+     - .env
```

`.env`
```
MYSQL_PASSWORD=mypassword
```

```
$ docker-compose up
```

---
## ホストとコンテナ間のファイル共有の速度向上
ある程度開発が進むとコンテナとホスト間でファイル共有速度が課題になってきます。  
Dockerではその対策としてファイルの共有速度を改善するためのオプションが存在します。  
以下の3つのオプションをユースケースに応じて設定するとより高速な環境を手に入れることができるでしょう。


### オプション
- `consistend` (default)
    - ホストとコンテナ間の一貫性を担保するオプション
    - このオプションはデフォルトで使用されるのですが、オーバーヘッドが大きいのでファイルの更新が発生する場合は使用しないことをオススメします。
- `cached`
    - ホスト側の更新を優先するオプション
    - e.g.
        - サービスコードのようなホスト側で更新するケース
- `delegated`
    - コンテナ側の更新を優先するオプション
    - e.g.
        - MySQLのようなコンテナからホストへの書き込みしかないケース。
        - コンテナ上からライブラリのインストールをするコマンド(`composer install` , `npm install` ,etc )を使用する際。

### docker-composeのサンプル
node.js x MySQLを想定したdocker-composeファイル
```diff
version: '3.7'

services:
  app:
    build: .
    volumes:
-     - .:/app
-     - ./node_modules:/app/node_modules
+     - .:/app:cached
+     - ./node_modules:/app/node_modules:delegated

  mysql:
    image: mysql:5.7
    volumes:
-     - ./mysql:/var/lib/mysql
+     - ./mysql:/var/lib/mysql:delegated
```

- [Performance tuning for volume mounts (shared filesystems) | Docker Documentation](https://docs.docker.com/docker-for-mac/osxfs-caching/)

---
## 標準入力を有効にする
標準入力をdocker-composeでも使用したいパターンが度々存在すると思います。例えばRuby on Railsのpryのようなデバッガーを使う場合です。  
docker-composeでは標準入力を使用するためには以下のように明示的に設定することで使用することが可能になります。

```diff
version: '3.7'
services:
  rails:
    build: .
+   tty: true
+   stdin_open: true
    ports:
      - '3000:3000'
    volumes:
      - './:/app:cached'
```

---
## Multi-Stage Buildのローカル活用
Golangのようなビルドを行う言語でMulti-Stage Buildを使用する場合、過去のレイヤーを使用したい場合があるとおもいます。  
例えば最終成果となるレイヤーは軽量なものにしたいが、ビルドに使用したレイヤーをローカル開発でも用いるなど。  

docker-composeの場合明示的にレイヤーを指定することで使用することが可能です。

```dockerfile
FROM golang:1.12-alpine as build

WORKDIR /go/app

COPY . .

RUN apk add --no-cache git \
  && go build -o app

FROM alpine

WORKDIR /app

COPY --from=build /go/app/app .

RUN addgroup go \
  && adduser -D -G go go \
  && chown -R go:go /app/app

CMD ["./app"]
```

```diff
version: '3.7'

services:
  app:
    build:
      context: .
+     target: build
    volumes:
      - ./:/go/app
    command: go run main.go
```

---
## docker-compose間のnetworkの共有
プロジェクトのマイクロサービス化によってフロントとバックエンドでリポジトリが分かれることがあるとおもいます。  
その際ネットワークの共有が必要になるのですが、以下のように記述することでネットワークを共有することが可能です。

### backend
`internal` と `external` の2つのネットワークを用意します。  

`internal` はリポジトリ内の内部的な通信のネットワークです。MySQLのようなデータストアを不用意に公開しないために使用します。  
`externla` はリポジトリ外へ公開するためのネットワークです。

```diff
version: '3.7'

services:
  api:
    build: .
    ports:
      - 8000:80
+   networks:
+     - internal
+     - external

  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
+   networks:
+     - internal

+networks:
+  internal:
+    internal: true
+  external:
+    name: api_network
```

### web
```diff
version: '3.7'

services:
  web:
    #XXX APIアクセスはcurlで代用。
    image: amazonlinux:2
    command: curl api:80

+networks:
+  default:
+    external:
+      name: api_network
```

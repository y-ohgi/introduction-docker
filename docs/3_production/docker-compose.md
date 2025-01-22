---
title: docker compose
description: プロジェクトでDockerを使用する際、ローカル環境で採用されることの多いdocker composeを紹介します。
---

docker compose(以下compose)は複数のローカル開発環境で複数のコンテナを協調させるための機能です。

プロダクトの開発ではフロントエンド・バックエンド・データストアなどなど、複数のコンポーネントが必要になります。  
composeは簡単にいうとローカル開発環境に必要な欠かせない機能を提供してくれます。  
例えばそれぞれのコンポーネントのイメージのビルド・コンテナの同時起動・コンテナとホスト間のファイル共有・ネットワーク管理など。

## composeの設定
一見難しそうですが、実際にサンプルをお見せします。  
composeのシンプルさを体験してもらえればと思います。

![compose](./imgs/compose.png)

Next.jsをアプリケーションとして、データストアをPostgreSQLにする例です。

compose機能を使用するためには、 `compose.yaml` という設定ファイルが必要になります。  
今回の例であれば以下のような設定ファイルになります。  

```yaml
services:
  next:
    image: node:22-slim
    # 作業ディレクトを "/app" に設定
    working_dir: /app
    # ホストのカレントディレクトリを、コンテナ内の "/app" ディレクトリと共有
    volumes:
      - ./:/app
    # 3000番ポートを公開
    ports:
      - 3000:3000
    # 起動コマンド
    command: npm run dev

  postgres:
    image: postgres:16-alpine
    # Dockerのvolume機能を使ってデータの永続化
    volumes:
      - db-data:/var/lib/postgresql/data
    # 環境変数でユーザー・パスワードの設定とデータベースの作成
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: next

volumes:
  db-data:
```

1つのシンプルな設定ファイルで、既存のコードの変更は不要です。  

composeは以下のコマンドで起動できます。

```
$ docker compose up -d
```

実際にアクセスできるかを確認し、composeの終了まで行います。
```
$ curl localhost:3000
  :
$ docker compose down
```

!!! note "compose内のコンテナ間通信"
    compose内では独自のBright networkを作成します。  
    そのnetwork内では `services` で命名したコンテナ名をホスト名と使用し通信可能です。  
    例えば今回の例であれば、 `postgres` に接続したい場合、 `postgresql://postgres:postgres@postgres:5432/db` というuriを使用することになります。

## compopse.yamlの設定
compose.yaml を書く際、よく使用される要素を紹介します。

ref: <a href="https://docs.docker.com/compose/compose-file/05-services/" target="_blank" rel="noopener noreferrer">Services top-level elements | Docker Docs</a>

### services
```yaml
services:
  <CONTAINER_1>:
    :
  
  <CONTAINER_2>:
    :
```

composeは複数のコンテナを協調させて動かすツールです。  

`services:` はそのコンテナ群を定義するブロックです。  
以下の例のように `<CONTAINER_1>:` と続けてコンテナの定義を行います。  
`<CONTAINER_1>` は任意のコンテナ名を付けることが可能で、このコンテナ名を元にコンテナ間通信を行います。そのため、同じコンテナ名を付けることはできません。


### image
```yaml
services:
  postgres:
    image: postgres
```

使用するイメージを宣言するブロックです。  
例えばpostgresやmysqlのようなイメージは自身でDockerfileを作成せず、Docker Hubの公式のイメージを使用することが一般的です。

### build
```yaml
services:
  next:
    build: .
```

Dockerfileを使用しイメージのビルドを行い、そのイメージを使用することを宣言するブロックです。  
Next.jsやLaravelなど、アプリケーションコードをDockerfileで管理している場合に使用します。

```yaml
services:
  front:
    build:
      context: ./front
  
  api:
    build:
      context: ./api
      target: builder

  postgres:
    image: postgres
```
フロントエンドとバックエンドをそれぞれを `context` ブロックでディレクトリを指定し、postgresはイメージを使用する例です。  

この際それぞれのディレクトリにDockerfileが含まれている必要があります。  
また、 `target` を使用することでマルチステージビルドのステージを指定することも可能です。

### volumes
```yaml
services:
  next:
    build: .
    volumes:
      - .:/app
```

コンテナにボリュームマウントするためのブロックです。  
カレントディレクトリをコンテナの特定のパスと同期させたり、Docker Volumeを使用することが可能です。

```yaml
services:
  next:
    build: .
    volumes:
      - .:/app
      - node_modules:/app/node_modules

volumes:
  node_modules:
```

ioの激しいディレクトリにはDocker Volumeを使うことも可能です。  
カレントディレクトリのnode_modulesは無視され、Docker Volumeを参照します。

### ports
```yaml
services:
  postgres:
    image: postgres
    ports:
      - 5432:5432
```

コンテナのポートをホストに公開する宣言を行うブロックです。  

### environment
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: next
```

コンテナ内に環境変数の定義を行うブロックです。  
postgresやmysqlのようなイメージは特定の環境変数を宣言することでユーザー・パスワード・データベースの作成をサポートしています。

参照: <a href="https://hub.docker.com/_/postgres" target="_blank" rel="noopener noreferrer">Docker Hub</a>

### env_file
```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file:
      - .env
```

特定のファイルを元にコンテナ内に環境変数の定義を行うブロックです。  
dotenvのようなライブラリを使用している場合、 `env_file` で代替可能です。

### command
```yaml
services:
  next:
    build: .
    command: npm install & npm run dev
```

任意のコマンド( `CMD` )を上書きするブロックです。  
`CMD` で宣言されているコマンドを上書きし、任意のコマンドを実行可能です。  


### depends_on & healthcheck
```yaml
services:
  next:
    # postgresの起動を待つ
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine    
    # ヘルスチェック
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5
```
`depends_on` は依存関係を示すもので、特定のコンテナの起動を前提として起動を行うためのブロックです。  

また、 `healthcheck` ブロックを併用することでコンテナが動いていることを確認できてから順番に起動することが可能になります。  

## composeをプロダクションで使うために
最初に記載したサンプルではシンプルに起動するための例でした。  
「compopse.yamlの設定」で紹介した設定を元に、プロダクションで使うためにサンプルのyamlを元に書き直してみましょう。

実際には以下の要件が出てくることが多いです。
* 自作のDockerfileを使用する
* マルチステージビルドの特定のステージを使用する
* postgresのポートをホストにも開放する
* volume機能ではなくホストのディレクトリにデータベースのデータを永続化する

それぞれ対応した例が以下のファイルになります。
```yaml
services:
  next:
    # 自作のDockerfileを使用する
    build:
      # ビルドを行うディレクトリ
      context: .
      # マルチステージビルドをしている場合、使用するステージを指定
      target: deps
      # e.g. デフォルトではDockerfileを読みますが、 "./Dockerfile.dev" と書くことで別のDockerfileを指定することも可能です。
    volumes:
      - ./:/app
    ports:
      - 3000:3000
    command: npm install && npm run dev

  postgres:
    image: postgres:16-alpine
    # tmpディレクトリに永続化。
    volumes:
      - ./tmp/db-data:/var/lib/postgresql/data:cached
    # ホストにもポートを公開
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: next
```

## 「docker-compose」から「docker compose」への移行
compose機能はメジャーバージョンアップでv2となり、docker-composeはcomposeサブコマンドとなりました。  

ここでは簡単に、docker-composeとcomposeの差分について紹介します。

参照: <a href="https://www.docker.com/ja-jp/blog/new-docker-compose-v2-and-v1-deprecation/" target="_blank" rel="noopener noreferrer">Docker Compose: 新機能、変更点、今後の予定 | Docker</a>

### docker-composeコマンドの廃止
一番の変更点かつ、唯一変更が必要な点です。

`docker-compose` コマンドが廃止され、 `docker compose` に統一されます。  
既存のプロダクトで `docker-compose` コマンドを使用している場合は、 `docker compose` へ移行しましょう。

シェルスクリプトやmakefileなどで `docker-compose` をラップしている場合を考慮して、一度リポジトリ内の検索をお勧めします。

### ファイル名の変更
`docker-compose.yaml` から `compose.yaml` がデファクトとなりました。  

`compose.yaml` が存在しない場合、 `docker-compose.yaml` を読みに行く仕様となっています。

### compose.yamlのversionブロックが不要に。
以下のように今までは `docker-compose.yaml` の1行目に `version` を記述していましたが不要になりました。
```yaml
version: '3'

services:
  :
```

こちらに関しては単純に `version` ブロックを削除するだけです。
```diff
- version: '3'
- 
services:
  :
```

## まとめ
* composeはDockerを使用する場合ローカル開発環境に欠かせない技術です。
* composeの設定は1ファイルで完結するためシンプルかつ、既存のコードへの変更は不要です。
* composeはv2にメジャーバージョンアップしました。

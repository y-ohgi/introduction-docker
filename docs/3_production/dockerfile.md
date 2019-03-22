この章ではDockerfileを記述する際のベストプラクティスについて記述します。

## 軽量なイメージを作る
Docker Image はレイヤーが少なくサイズが軽いものが良いものだとされています。  
レイヤーを増やすことはオーバーヘッドに繋がり、サイズはImageのpullの速度に繋がります。

どのようなアプローチでDocker Image を作成すると良いかを見ていきましょう。

### 最小限の構成にする
例えばPHPの環境を構築するのにCentOSのベースイメージで、phpenvを入れて、MySQLを入れて、、といったことは非推奨です。  
DockerはいままでのVMとは思想が異なります。1コンテナ1プロセスになるように設計を行いましょう。  
復数のプロセスを使用したい場合はそれぞれコンテナに分け、オーケストレーションツールを使用してコンテナを協調させて動かしましょう。

### 軽量なベースイメージを使用する
Alpine OS という非常に軽量なOSが存在します。  
まずはこのAlpine OS がベースとなっているDocker Image を使いましょう。

メジャーな言語は一通りAlpineOSに対応しており、Node.jsも例に漏れず対応しております。  
(nodeのDocker Image が12倍の差があります)
![node alpine](imgs/node-alpine.png)

---

## Build
### キャッシュを意識する
Docker Image は各コマンド毎にキャッシュを作成します(これを中間レイヤーと呼びます)。  
ビルド後に、コマンドの変更・ファイルの追加/更新など、なにか変化を起こすと、変化が起こったレイヤーの直前のキャッシュからビルドを実行します。  

例えば単純な依存ライブラリのインストールだけ行えば問題ないNode.jsのアプリケーションがあったとします。  
開発中は頻繁にコードの変更を行うはずです。コードの変更を行えばせっかく作成したキャッシュが効かなくなってしまい、ビルドのし直しになってしまいます。  
単純な `npm install` が必要なアプリケーションであれば `package.json` と `package-lock.json` だけをコンテナ上へコピーして、その後スクリプトのコピーを行うと高速なビルドを実現できるでしょう。

```diff
  FROM node:alpine
  
  WORKDIR /scripts
  
- COPY . .
+ COPY ./package.json ./package-lock.json /scripts/
  
  RUN npm install --production
  
+ COPY . .
  
  CMD ["npm", "run", "start"]
```


## Multi-Stage Build
Golangのようなビルドを行い成果物をバイナリとして吐き出す言語であれば、最小限のOSと成果物のバイナリの2つだけで動作します。  
この2つだけの最低限の環境を用意するために活躍するのがMulti-Stage Buildです。  

Multi-Stage Buildは復数のDocker Image を作り、最終的にその復数のDocker Image から任意のファイルだけを抽出して1つのDocker Image にします。  

```dockerfile
#==================================================
# Build Layer
FROM golang:1.12-alpine as build

WORKDIR /go/app

COPY . .

RUN apk add --no-cache git \
  && go build -o app

#==================================================
# Run Layer
FROM alpine

WORKDIR /app

COPY --from=build /go/app/app .

RUN addgroup go \
  && adduser -D -G go go \
  && chown -R go:go /app/app

CMD ["./app"]
```

---
title: VMとDocker
description: VMとDockerの違いについて紹介します。
---

Dockerを使用する際にも他の技術と同様にセキュリティを考慮する必要があります。

## rootユーザを使わない
rootユーザはCapabilityで制御されてはいますが、コンテナ内に侵入されたときに最小限の影響に留めるためにも過剰な権限は基本的に不要です。  
Dockerのベースイメージは基本的にrootユーザーになっています。  
`USER` コマンド使用してユーザーを変更し、chmodなどで権限を最適化ましょう。

### 公式のベースイメージのデフォルトユーザーを確認
公式のnodeイメージをベースイメージとし、現在のユーザーを確認する `whoami` を実行するイメージを作成してみます。
```Dockerfile
FROM node:22-slim

CMD whoami
```

ビルドし、実行するとrootユーザーになっていることが確認できました。
```bash
$ docker build -t whoami .
$ docker run whoami
root
```

では、 `USER` コマンドを使用しユーザーを設定してみます。
```Dockerfile
FROM node:22-slim

USER node

CMD whoami
```

nodeユーザーに変更できたことが確認できました。
```bash
$ docker build -t whoami-node .
$ docker run whoami-node
node
```

## 野良のDockerイメージをベースイメージにしない
非公式のユーザー製のイメージをベースイメージとして使うことは非常に危険です。  

悪意を持った野良イメージは過去に何度も登場し、イメージ内に悪意のあるスクリプトが含まれていることがあります。  
また、GitHubなどでDockerfileが公開されており、選定するタイミングでは問題がなかったものの更新されリスクのあるベースイメージになってしまうケースもありました。  

基本的にベースイメージは公式のものをしようするようにしましょう。

## ビルド時に機微情報を与えない
ビルド時にパスワードや秘密鍵のような機微情報を与え、最終イメージに残らないようにしましょう。  
基本的にビルド後に環境変数としてパスワードなどの機微情報を渡すことがベストプラクティスです。  

Private Repositoryのcloneなど、どうしても機微情報が必要な場合は `--secret` や ` --ssh` オプションを使用してセキュアにビルドをしましょう。  

現在はデフォルトで有効化されているBuildKitであればレイヤー内で機微情報を削除し、 **最終イメージに機微情報が残らなければ** 基本的に問題ないです。

## .dockerignore ファイルでローカルの不要なパスを無視する
Dockerビルド時に無視するパスを記述するファイルで、 `.gitignore` のようなイメージに近いです。  

`.git` や  `node_modules` のようなビルド時に不要なパスを記述することでビルドが高速かつイメージが軽量になるメリットがあります。  
逆に、 `.env` のようなDBへの接続情報やAPIのアクセスキーが記載されているファイルをビルドに含めてしまうことは最終イメージに機微情報が入ってしまうセキュリティイスクに繋がります。  

e.g. `.dockerignore`
```
.git/*
.github/*
.node_modules/*
test/*
tmp/*

.env*

Dockerfile
compose.yaml
```

## イメージを塩漬けにしない
スナップショットとしてそのタイミングのイメージをビルドするため、良くも悪くもセキュリティリスクは時間とともに増えていきます。  
例えば、ベースイメージとなるランタイムのバージョンで脆弱性が発生した場合、次のバージョンのベースイメージに変更する必要があります。  
また、ベースイメージのランタイムだけでなく、内部のミドルウェアやライブラリの更新も同様に必要になります。

1度完成したイメージは脆弱性のスキャンや、他の技術同様日頃からセキュリティの情報を追うことは必要です。

## イメージの脆弱性スキャンを有効化する
イメージに対して脆弱性スキャンをかける技術は一般的に普及しています。  

### CI/CD
docker社が提供するGitHub Actionが存在します。  
CI/CDなどのworkflow内で実行することでCVEベースで脆弱性の検知を行なってくれます。  

[docker/scout-action: Docker Scout GitHub Action](https://github.com/docker/scout-action)

### レジストリ
クラウドベンダーが提供するマネージドなイメージのレジストリにはイメージのスキャン機能がついていることが多いです。  
セキュリティリスクを減らすために有効化をお勧めします。

* AWSであればAmazon Elastic Container Registry
  * [Amazon ECR でソフトウェアの脆弱性がないかイメージをスキャンする - Amazon ECR](https://docs.aws.amazon.com/ja_jp/AmazonECR/latest/userguide/image-scanning.html)
* Google CloudであればArtifact Artifact Registry
  * [Container scanning overview  |  Documentation  |  Google Cloud](https://cloud.google.com/artifact-analysis/docs/container-scanning-overview)

### Dockerfile内
別の章で紹介するマルチステージビルドを利用し、Dockerfile内でセキュリティツールを実行するアプローチもあります。

```Dockerfile
FROM aquasec/trivy:latest AS trivy

FROM myapp:latest

COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy

RUN trivy filesystem --exit-code 1 --no-progress /
```

[Trivy Home - Trivy](https://trivy.dev/)

### サイドカー
Snykを使用し、実行中もサイドカーコンテナとしてリアルタイムで自動検知を行う選択肢もあります。

[sidecar vulnerabilities | Snyk](https://security.snyk.io/package/npm/sidecar)

### その他
他にもどのようなツールがあるのか、CNCFでセキュリティプロダクトの一覧を見ることもお勧めです。

[CNCF Landscape](https://landscape.cncf.io/?view-mode=card&classify=category&sort-by=name&sort-direction=asc#provisioning--security-compliance)

## ファイルのマウントが必要な場合は最小限に。
ホストのファイルをマウントする際は十分に注意してマウントを行いましょう。  
最小限の権限(Read-Onlyにするなど)でマウントするパスは必要最低限にしましょう。

また、特に注意が必要なのはdockerソケットです。  
dockerソケットが乗っ取られてしまうとそれを踏み台に任意のdockerイメージを起動されてしまうなど大きなセキュリティリスクになります。

しかし、CIや監視などでdockerソケットのマウントを要求するツールも存在します。  
安易に与えるのは控え、ソケットをマウントしなければならない場合はRead-Onlyでマウントするようにしましょう。

## 中間レイヤーから機微情報を抜き出す例
Dockerのビルドはレイヤー毎にスナップショットがとられ、次のビルドの高速化のために中間レイヤーが生成されます。  
Dockerのv20からはデフォルトでBuildKitが有効になり容易に中間レイヤーにアクセスできなくなりましたが。  
しかし、 `docker save` コマンドでtarとして出力してから任意のレイヤーを吐き出すように設定を書き換えて `docker load` でアクセスすることは可能です。

今回はわかりやすいよう、BuildKitを無効化し、中間レイヤーから機微情報を抜き出してみます。

一時的に "mypassword" と記載されたテキストファイルを /tmp/pass.txt に配置し、その後 /tmp/pass.txt を削除するイメージを作成してみます。
```Dockerfile
FROM node:22-slim

RUN echo "mypassword" > /tmp/pass.txt

RUN echo "delete password" > /tmp/pass.txt

CMD cat /tmp/pass.txt
```

BuildKitを無効化し、ビルドを実行します。
```bash
$ DOCKER_BUILDKIT=0 docker build -t pass .
DEPRECATED: The legacy builder is deprecated and will be removed in a future release.
            BuildKit is currently disabled; enable it by removing the DOCKER_BUILDKIT=0
            environment-variable.

Sending build context to Docker daemon  3.072kB
Step 1/4 : FROM node:22-slim
 ---> ba83b0f18f30
Step 2/4 : RUN echo "mypassword" > /tmp/pass.txt
 ---> Using cache
 ---> b48e7229fe78
Step 3/4 : RUN echo "delete password" > /tmp/pass.txt
 ---> Using cache
 ---> cdf556ff4f4b
Step 4/4 : CMD cat /tmp/pass.txt
 ---> Running in a5c245f8588e
 ---> Removed intermediate container a5c245f8588e
 ---> 26a1e198ef63
Successfully built 26a1e198ef63
Successfully tagged pass:latest
```

成果イメージを実行すると、 delete password と出力され想定通りの出力となっています。
```bash
$ docker run pass
delete password
```

ビルド時にキャッシュされたレイヤーを指定して、 `/tmp/pass.txt` の内容を確認してみます。
```
Step 2/4 : RUN echo "mypassword" > /tmp/pass.txt
 ---> Using cache
 ---> b48e7229fe78
```

mypassword と出力されてしまい、中間レイヤーに機微情報が残ってしまっていることが確認できてしまいました。
```bash
$ docker run b48e7229fe78 cat /tmp/pass.txt
mypassword
```


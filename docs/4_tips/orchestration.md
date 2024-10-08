---
title: オーケストレーションツール
description: Dockerを運用するために必須なオーケストレーションツールについて紹介します。
---

## オーケストレーションツールとは
1つ以上のコンテナを管理するためのツールです。

コンテナは非常に軽量で可搬性・移植可能性が高く、開発環境からステージング環境・本番環境まで1つのイメージで1つの環境を完結させることが可能です。  
しかし、コンテナには本番運用のための機能は備わっていません。

コンテナオーケストレーションツールにはコンテナを管理し、運用するための様々な機能が備わっています。  
例えば、コンテナのためのリソースプールの管理・コンテナのデプロイ・セルフヒーリング・ネットワーク・オートスケールなどです。

コンテナオーケストレーションによって責務や機能が異なるので、代表的なオーケストレーションツールを紹介します。

## 代表的なオーケストレーションツール
### compose
Docker社が提供するオーケストレーションツールです。  
ローカルでdockerを動かす際のデファクトスタンダードとなっているツールです。  

### swarm
同じくDocker社が提供するOSSのオーケストレーションツールです。  
docker composeと相性がよく、 `compose.yaml` を拡張することで本番のワークロードでDockerを使用することができます。  

### ECS (Elastic Container Service)
AWSが提供するマネージドサービスの1つです。  
他のAWSサービスの連携が得意で、AWSを使用する場合には候補に上がるものです。

### Kubernetes
Google社が開発したOSSのオーケストレーションツールです。  
機能が多く豊富なエコシステムがあり、CNCFなどコミュニティも非常に活発です。  

クラウドベンダーもそれぞれマネージドKubernetesを提供しており、ロックインされない環境を求める場合は選択肢に上がります。  
しかし、学習コストが高く、3ヶ月毎にアップデートを行う必要があるなど、採用する際は他の選択肢とPoCを行なってからが望ましいでしょう。

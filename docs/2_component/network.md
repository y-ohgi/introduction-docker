## Networkを使用する
![network](imgs/network.png)

Dockerではネットワークの扱いが重要になってきます。  
先述したDocker Container の動きの通り **1コンテナでは1プロセスを動かす** 設計をされおり、復数プロセスを協調して動かすときにはネットワークを使用します。 

NetworkはKubernetesやECS、docker-composeのような各種オーケストレーションツールを使用する際に意識する必要があります。

## Driverの種類
![network-driver](imgs/network-driver.png)

Dockerは2種類のNetwork Driverが存在します。

### 1. `bridge`

Dockerを使用する際は基本的にこのNetwork Driverを使用します。  
また、何も指定せずDocker Container を起動すると `docker0` という名前のbridgeネットワークに所属します。

### 2. `host`
ホストマシンのeth0を直接使用する方法です。

### 3. `none`
どのDriverも使用せず、起動したコンテナをネットワークにも所属させないための設定です。

## ネットワークを試す

### 1. デフォルトで存在するネットワークの確認

現在Dockerが管理しているNetwork一覧を出力します。  
```
$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
5d465d8f421e        bridge              bridge              local
8ca0ba4f70cb        host                host                local
f4c209eabaad        none                null                local
```

ホスト側のネットワークも確認して未ましょう。docker0が存在しますね。
```
$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN
    link/ether 02:42:2e:03:36:31 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
22640: eth0@if22641: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether f6:bf:f5:fa:9e:f1 brd ff:ff:ff:ff:ff:ff
    inet 192.168.0.17/23 scope global eth0
       valid_lft forever preferred_lft forever
22644: eth1@if22645: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:12:00:13 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.19/16 scope global eth1
       valid_lft forever preferred_lft forever
```

### 2. 新しいネットワークの作成
次は新しいBridgeネットワークを作成してみます。

```
$ docker network create myapp
c1c6dc411d0c16dd463a5e74ea1ad2709fad5b24091c956ea6850ea304393d43
```

networkに `myapp` が増えていることを確認します。
```
$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
5d465d8f421e        bridge              bridge              local
8ca0ba4f70cb        host                host                local
c1c6dc411d0c        myapp               bridge              local
f4c209eabaad        none                null                local
```

### 3. 作成したNetworkへnginxを参加させる
通信を受けるためのサーバーとしてnginxを構築します。  
```
$ docker run --name nginx --network=myapp -d nginx
```

### 3. AmazonLinux2を起動し、Nginxコンテナへ接続する
Nginxへ接続するためにAmazonLinux2を使用します。  
単純にcurlで `nginx:80` へ接続してみましょう。

```
$ docker run --network=myapp -it amazonlinux:2 curl nginx:80
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
$ 
```

### 4. 新しくネットワークを作成し、疎通できないことを確認する
`myapp2` というネットワークを作成し、 `nginx2` という命名でnginxを起動する。
```
$ docker network create myapp2
$ docker run --name nginx2 --network=myapp2 -d nginx
```

`myapp` ネットワークに所属しているAmazonLinux2からcurlを実行し、疎通できないことを確認する。
```
$ docker run --network=myapp -it amazonlinux:2 curl nginx2:80
curl: (6) Could not resolve host: nginx2
```

## まとめ
- 1プロセス1コンテナ、復数プロセスはネットワークを通して通信を行う。
- Bridgeを基本的に使用する。

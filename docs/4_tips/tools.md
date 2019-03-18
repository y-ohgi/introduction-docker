dockerを使用する際に便利なツール

## Kitematic
![kitematic](imgs/kitematic.png)

KitematicというdockerをGUIベースで扱うためのツールです。  
ローカルのDockerの管理はもちろんDockerHubの検索など、非常に高機能で見やすいのでGUIで扱いたい人には良いとおもいます。  
私はCLIでしか使わないのでGUIは知らないです。

### Install
mac
```
$ brew cask install kitematic
```

windows  
[Install Docker Toolbox on Windows | Docker Documentation](https://docs.docker.com/toolbox/toolbox_install_windows/)

---
## `docker-clear`
Dockerリソースを削除するためのコマンド。  
Dockerは基本的にエフェメラルであるべきなので脳死で定期的に打っていくといいとおもいます。とてもすき。べんり。  

### Example
現在起動中のcontainerに関連しないリソース(container, image, network, volume)を削除する。  
```
$ docker-clear stop
```

Dockerのリソース全てを削除する。  
起動中のcontainerも削除される点に注意。  
```
$ docker-clear all
```

### Install
mac  
```
$ brew install docker-clean
```

windows  
[ZZROTDesign/docker-clean: A script that cleans docker containers, images, volumes, and networks.](https://github.com/ZZROTDesign/docker-clean)

---
## dlayer
Docker imageのレイヤーの詳細を確認することができます。  
imageの軽量化を試みる際に非常に有用です。

```

```
